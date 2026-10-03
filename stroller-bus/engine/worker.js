importScripts('router.js');
onmessage=function(e){try{const result=BusNetwork.search(e.data.data,e.data.query);postMessage({result});}catch(err){postMessage({error:err.message});}};
