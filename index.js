//实现一个类似于“交通灯”的效果，让三个不同颜色的圆点每隔 2 秒循环切换

//version 1.0
/*
const traffic=document.getElementById("traffic");
(function reset(){
  traffic.className="wait";
  setTimeout(function(){
    traffic.className="stop";
    setTimeout(function(){
     traffic.className="pass";
      setTimeout(reset,2000)
    },2000)
  },2000);
})();
*/

//首先是过程耦合，状态切换是wait->stop->pass 循环，在上面的设计里，实际上操作顺序是耦合在一起的，要先 ‘wait’，然后等待 2000 毫秒再 ‘stop’，然后再等待 2000 毫秒在 ‘pass’，这中间的顺序一旦有调整，需求有变化，代码都需要修改。

//其次，这样的异步嵌套是会产生 callback hell 的，如果需求不是三盏灯，而是五盏灯、十盏灯，代码的嵌套结构就很深，看起来就很难看了。

//所以我们说，版本一方法虽然直接，但因为抽象程度很低（几乎没有提供任何抽象 API），它的扩展性很不好，因为异步问题没处理，代码结构也很不好。如果只能写这样的代码，是不能说就写好了 JavaScript 的。

//vesion 2.0 
//要解决版本一的过程耦合问题，最简单的思路是将状态['wait','stop','pass']抽象出来：
/*const traffic =document.getElementById("traffic");
var stateList = ["wait","stop","pass"];
var currentStateIndex=0;
setInterval(function(){
		var state =stateList[currentStateIndex];
    traffic.className=state;
    currentStateIndex=(currentStateIndex+1) % stateList.length;
},2000);*/
/*最大的问题就是封装性很差，它把 stateList 和 currentStateIndex 都暴露出来了，而且以全局变量的形式，*/

//version 3.0
/*
const traffic =document.getElementById('traffic');
function start(traffic,stateList){
	var currentStateIndex=0;
  setInterval(function(){
  	var state=stateList[currentStateIndex];
    traffic.className=state;
    currentStateIndex=(currentStateIndex+1)%stateList.length;
  },2000);
}
start(traffic,['wait','stop','pass']);
*/

//version 4.0
/*
const traffic =document.getElementById('traffic');
function poll(...fnList){
	let stateIndex=0;
  return function(...args){
  	let fn = fnList[stateIndex++ % fnList.length];
    return fn.apply(this,args);
  }
}
function setState(state){
	traffic.className=state;
}
let trafficStatePoll=poll(
						setState.bind(null,'wait'),
            setState.bind(null,'stop'),
            setState.bind(null,'pass'));
 setInterval(trafficStatePoll,2000);
 */
 /*
 这一版用的是过程抽象的思路，而过程抽象，是函数式编程的基础。在这里，我们抽象出了一个 poll(...fnList) 的高阶组合函数，它将一个函数列表组合起来，每次调用时依次轮流执行列表里的函数。

我们说，程序设计的本质是抽象，而过程抽象是一种与数据抽象对应的思路，它们是两种不同的抽象模型。数据抽象比较基础，而过程抽象相对高级一些，也更灵活一些。数据抽象是研究函数如何操作数据，而过程抽象则在此基础上研究函数如何操作函数。所以说如果把抽象比作数学，那么数据抽象是初等数学，过程抽象则是高等数学。同一个问题，既可以用初等数学来解决，又可以用高等数学来解决。用什么方法解决，取决于问题的模型和难度等等。
 */
/*
好了，上面我们有了四个版本，那么是否考虑了这些版本就足够了呢？

并不是。因为需求是会变更的。假设现在需求变化了：

需求变更：让 wait、stop、pass 状态的持续时长不相等，分别改成 1秒、2秒、3秒。
*/

//version 5.0
/*
const traffic=document.getElementById('traffic');
function wait(time){
	return new Promise(resolve=>setTimeout(resolve,time));
}
function setState(state){
	traffic.className=state;
}
function reset(){
	Promise.resolve()
  	.then(setState.bind(null,'wait'))
    .then(wait.bind(null,1000))
    .then(setState.bind(null,'stop'))
    .then(wait.bind(null,2000))
    .then(setState.bind(null,'pass'))
    .then(wait.bind(null,3000))
    .then(reset);
}
reset();
*/
//版本五的思路是，既然我们需要考虑不同的持续时间，那么我们需要将等待时间抽象出来：



//version 5.1 把Promise改成async和await
/*
const traffic=document.getElementById('traffic');
function wait(time){
	return new Promise(resolve=>setTimeout(resolve,time));
}
function setState(state){
	traffic.className=state;
}
async function asyncPrint(time1,time2,time3) {
	setState('wait');
  	await wait(time1);
  setState('stop');
  	await wait(time2);
  setState('pass');
  	await wait(time3);
    asyncPrint(1000, 2000,3000);
}
asyncPrint(1000, 2000,3000);
*/

//我们还可以进一步抽象，设计出版本六，或者类似的对象模型：
//version 6.0
const trafficEl = document.getElementById("traffic");
 
function TrafficProtocol(el, reset){
  this.subject = el;
  this.autoReset = reset;
  this.stateList = [];
}
 
TrafficProtocol.prototype.putState = function(fn){
  this.stateList.push(fn);
}
 
TrafficProtocol.prototype.reset = function(){
  let subject = this.subject;
 
  this.statePromise = Promise.resolve();
  this.stateList.forEach((stateFn) => {
    this.statePromise = this.statePromise.then(()=>{
      return new Promise(resolve => {
        stateFn(subject, resolve);
      });
    });
  });
  if(this.autoReset){
    this.statePromise.then(this.reset.bind(this));
  }
}
 
TrafficProtocol.prototype.start = function(){
  this.reset();
}
 
var traffic = new TrafficProtocol(trafficEl, true);
 
traffic.putState(function(subject, next){
  subject.className="wait";
  setTimeout(next, 1000);
});
 
traffic.putState(function(subject, next){
  subject.className = "stop";
  setTimeout(next, 2000);
});
 
traffic.putState(function(subject, next){
  subject.className = "pass";
  setTimeout(next, 3000);
});
 
traffic.start();