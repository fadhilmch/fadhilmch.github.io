(function(){
var P=document.querySelector('#lab-explorer-img');
if(P){var base=P.src.replace(/lab-[A-Za-z]+\.png.*$/,'');var notes={'lab-L.png':'L* alone is a complete grayscale photo. This is the model\'s input.','lab-La.png':'Adding a* only: faint pink on the rock, faint green in the shadows. The sky stays grey.','lab-Lb.png':'Adding b* only: the sky turns blue and the rock and plants turn yellow-brown. Most of the scene\'s colour is here.','lab-Lab.png':'All three channels: the original photo. The model must predict the last two.'};
document.querySelectorAll('#lab-explorer button').forEach(function(b){b.addEventListener('click',function(){document.querySelectorAll('#lab-explorer button').forEach(function(x){x.setAttribute('aria-pressed','false')});b.setAttribute('aria-pressed','true');var s=b.getAttribute('data-src');P.src=base+s;document.getElementById('lab-explorer-note').textContent=notes[s];});});}
var r=document.getElementById('cmp-range');
if(r){var top=document.getElementById('cmp-top'),h=document.getElementById('cmp-handle'),box=top.parentNode;function size(){top.firstElementChild.style.width=box.clientWidth+'px';}function set(){top.style.width=r.value+'%';h.style.left=r.value+'%';}r.addEventListener('input',set);window.addEventListener('resize',size);size();set();setTimeout(size,300);var im=top.firstElementChild;im.addEventListener('load',size);}
var svg=document.getElementById('net-svg');
if(svg){
var S=[
{t:'1. Input',d:'The grayscale image, L* only, one channel. The notebook scales it as L*/50 - 1. Nothing about colour has entered the network yet.',im:['ex1-gray.png']},
{t:'2. Encoder: down to 128 × 128',d:'A 3 × 3 convolution with stride 2 halves height and width and gives 64 channels. A second convolution widens it to 128 channels. Each position now describes a small neighbourhood, not a single pixel.'},
{t:'3. Encoder: down to 64 × 64',d:'Another stride-2 convolution halves the grid again. Channels go to 128, then 256. Edges and textures start to combine into larger local patterns.'},
{t:'4. Encoder: down to 32 × 32',d:'A third stride-2 convolution leaves a 32 × 32 grid. Two 512-channel convolutions and one back to 256 give the encoder output, 32 × 32 × 256. This is the local-detail path.'},
{t:'5. Context vector',d:'In parallel, the grayscale image is resized to 299 × 299, repeated across three channels and passed through pretrained Inception-ResNet-v2. The notebook keeps its 1,000 class outputs. This is one vector for the whole image, not a grid.'},
{t:'6. Fusion',d:'The 1,000-value vector is repeated at all 32 × 32 positions, concatenated with the encoder output (256 + 1,000 = 1,256 channels), then a 1 × 1 convolution mixes them back to 256 channels.'},
{t:'7. Decoder: back up',d:'A 128-channel convolution, then 2 × upsampling to 64 × 64 with 64 channels, upsampling again to 128 × 128 with 32 and 16 channels. Convolutions refine, upsampling restores the grid size.'},
{t:'8. Output: a* and b*',d:'A last convolution with tanh gives 2 channels at 128 × 128, upsampled to 256 × 256 × 2. Multiply by 128 to get predicted a* and b*, then stack them under the original L*.',im:['ex1-pred.png','ex1-truth.png']}];
var B=[ // [step, size, ch, label, shape]
[0,256,1,'256²×1'],[1,128,64,'128²×64'],[1,128,128,'128²×128'],[2,64,128,'64²×128'],[2,64,256,'64²×256'],[3,32,256,'32²×256'],[3,32,512,'32²×512'],[3,32,256,'32²×256'],
[5,32,1256,'32²×1256'],[5,32,256,'32²×256'],[6,32,128,'32²×128'],[6,64,64,'64²×64'],[6,128,32,'128²×32'],[7,128,2,'128²×2'],[7,256,2,'256²×2']];
var NS='http://www.w3.org/2000/svg';
function el(n,a){var e=document.createElementNS(NS,n);for(var k in a)e.setAttribute(k,a[k]);return e;}
var H=function(s){return 14+Math.sqrt(s)*6;},Wd=function(c){return 6+Math.sqrt(c)*1.3;};
var tot=0;B.forEach(function(b){tot+=Wd(b[2]);});var gap=(684-tot)/(B.length-1),x=8,blocks=[],fx=0;
B.forEach(function(b,i){var h=H(b[1]),w=Wd(b[2]),y=160-h/2;var g=el('g',{});var tp=el('polygon',{points:x+','+y+' '+(x+6)+','+(y-6)+' '+(x+w+6)+','+(y-6)+' '+(x+w)+','+y,class:'top'});var f=el('rect',{x:x,y:y,width:w,height:h,class:'blk'});g.appendChild(tp);g.appendChild(f);svg.appendChild(g);
 var late=x>600,lab=el('text',{x:late?694:x+w/2,y:i%2?236:214,'text-anchor':late?'end':'middle',visibility:'hidden'});lab.textContent=b[3];svg.appendChild(lab);
 if(i===8)fx=x+w/2;
 blocks.push({step:b[0],f:f,t:tp,l:lab});x+=w+gap;});
var ctx=el('rect',{x:fx-20,y:26,width:40,height:12,class:'blk'});var ctxT=el('text',{x:8,y:16,'text-anchor':'start'});ctxT.textContent='context vector from Inception-ResNet-v2';svg.appendChild(ctx);svg.appendChild(ctxT);
var ln=el('path',{d:'M'+fx+' 38V'+(160-H(32)/2-8),fill:'none',stroke:'var(--muted)','stroke-width':1.2,'stroke-dasharray':'3 3'});svg.insertBefore(ln,svg.firstChild);
blocks.push({step:4,f:ctx,t:null,l:null});
var bw=document.getElementById('net-buttons'),tx=document.getElementById('net-text'),ti=document.getElementById('net-images');
var base2=document.getElementById('lab-explorer-img')?document.getElementById('lab-explorer-img').src.replace(/lab-[A-Za-z]+\.png.*$/,''):'';
function show(i){blocks.forEach(function(b){var on=b.step===i;b.f.setAttribute('class','blk'+(on?' on':''));if(b.t)b.t.setAttribute('class',on?'on-top':'top');if(b.l)b.l.setAttribute('visibility',on?'visible':'hidden');});
 tx.innerHTML='';var s=document.createElement('strong');s.textContent=S[i].t;var p=document.createElement('span');p.textContent=S[i].d;tx.appendChild(s);tx.appendChild(p);
 ti.innerHTML='';(S[i].im||[]).forEach(function(n){var im=document.createElement('img');im.src=base2+n;im.alt=n.indexOf('gray')>-1?'Grayscale input':(n.indexOf('pred')>-1?'Predicted colour':'Ground truth');ti.appendChild(im);});
 Array.prototype.forEach.call(bw.children,function(b,j){b.setAttribute('aria-pressed',j===i?'true':'false');});}
S.forEach(function(s,i){var b=document.createElement('button');b.type='button';b.textContent=String(i+1);b.setAttribute('aria-label',s.t);b.addEventListener('click',function(){show(i);});bw.appendChild(b);});
show(0);}
})();
