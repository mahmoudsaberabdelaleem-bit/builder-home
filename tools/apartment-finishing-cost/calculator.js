const $ = id => document.getElementById(id);
const groups=['تجهيز','تأسيس','تشطيبات','تجهيزات إضافية'];
const definitions=[
 ['تجهيز الموقع ونقل المخلفات','مقطوعية','تجهيز',()=>1,1200,true],
 ['إزالة تشطيبات قائمة','مقطوعية','تجهيز',()=>1,2500,false],
 ['تعديل مبانٍ وقواطيع','مقطوعية','تجهيز',()=>1,3000,false],
 ['تأسيس الكهرباء واللوحة','مقطوعية','تأسيس',()=>1,18000,true],
 ['تأسيس سباكة المطبخ والحمامات','مقطوعية','تأسيس',()=>1,14000,true],
 ['عزل أرضيات المناطق الرطبة','م²','تأسيس',v=>v.wet,200,true],
 ['محارة حوائط وأسقف','م²','تشطيبات',v=>v.area*(v.wallFactor+1),100,true],
 ['تسوية أرضيات (غير شاملة سعر البلاط)','م²','تشطيبات',v=>v.area,60,true],
 ['أرضيات الغرف والصالة','م²','تشطيبات',v=>v.area-v.wet,400,true],
 ['أرضيات المطبخ والحمامات','م²','تشطيبات',v=>v.wet,350,true],
 ['سيراميك حوائط مطبخ وحمامات','م²','تشطيبات',v=>v.wallTiles,300,true],
 ['دهان حوائط وأسقف','م²','تشطيبات',v=>Math.max(0,v.area*(v.wallFactor+1)-v.wallTiles),70,true],
 ['أسقف جبس (مساحة تختارها)','م²','تشطيبات',()=>0,250,false],
 ['أبواب وحلق وإكسسوارات','عدد','تشطيبات',v=>v.doors,4500,true],
 ['شبابيك وزجاج وإكسسوارات','م²','تشطيبات',v=>v.windows,2200,true],
 ['أطقم صحية وخلاطات وتركيب','حمام','تجهيزات إضافية',v=>v.baths,8000,true],
 ['مفاتيح وبرايز وتشطيب كهرباء','مقطوعية','تجهيزات إضافية',()=>1,6000,true],
 ['وحدات إضاءة وتركيب','مقطوعية','تجهيزات إضافية',()=>1,4000,false],
 ['مطبخ وحوض وخلاط (دون أجهزة)','مقطوعية','تجهيزات إضافية',()=>1,25000,false],
 ['تأسيس تكييف وصرفه (دون أجهزة)','مقطوعية','تجهيزات إضافية',()=>1,5000,false],
 ['تنظيف نهائي وتسليم','مقطوعية','تجهيز',()=>1,1000,true]
];
let rows=[], demoMode=false, dimensionsDirty=false;
const number = n => new Intl.NumberFormat('ar-EG',{maximumFractionDigits:2}).format(n);
function readInputs(){
 const v={}; for(const id of ['area','wet','baths','doors','windows','wallFactor','wallTiles','reserve']){
 const input=$(id);if(!input.checkValidity()||input.value.trim()===''||!Number.isFinite(input.valueAsNumber))throw new Error('راجع القيم: المساحة أكبر من صفر، والأعداد والكميات غير سالبة وفي حدود الحقول.');v[id]=input.valueAsNumber;}
 if(v.wet>v.area)throw new Error('مسطح المطبخ والحمامات لا يمكن يكون أكبر من المساحة الصافية.');
 return v;
}
function createInput(type,label,value,handler,min='0'){
 const x=document.createElement('input');x.type=type;x.setAttribute('aria-label',label);
 if(type==='checkbox')x.checked=value;else {x.value=value;x.min=min;x.max='1000000000';x.step='any';}
 x.addEventListener('input',()=>{handler(type==='checkbox'?x.checked:x.value);calculate();});return x;
}
function render(){
 $('items').replaceChildren();
 rows.forEach((r,i)=>{
 const tr=document.createElement('tr');
 const on=document.createElement('td');on.append(createInput('checkbox','إدراج '+r.name,r.on,v=>r.on=v));
 const name=document.createElement('th');name.scope='row';
 if(r.custom){const inp=document.createElement('input');inp.value=r.name;inp.maxLength=120;inp.setAttribute('aria-label','اسم البند المخصص');inp.addEventListener('input',()=>r.name=inp.value);name.append(inp);}else name.textContent=r.name;
 const unit=document.createElement('td');unit.textContent=r.unit;
 const qty=document.createElement('td');qty.append(createInput('number','كمية '+r.name,r.qty,v=>r.qty=v));
 const rate=document.createElement('td');const inp=createInput('number','سعر '+r.name,r.rate,v=>r.rate=v);inp.placeholder='سعرك';rate.append(inp);
 const total=document.createElement('td');total.id='line-'+i;total.className='line-total';
 tr.append(on,name,unit,qty,rate,total);$('items').append(tr);
 });calculate();
}
function calculate(){
 let v;try{v=readInputs();$('validation').textContent='';}catch(e){$('validation').textContent=e.message;['grand','perMeter','subtotal','reserveAmount'].forEach(id=>$(id).textContent='—');$('coverage').textContent='النتيجة متوقفة: صحح المدخلات.';$('breakdown').replaceChildren();return;}
 if(dimensionsDirty){['grand','perMeter','subtotal','reserveAmount'].forEach(id=>$(id).textContent='—');$('coverage').textContent='الأبعاد اتغيرت. اضغط تحديث الكميات لتحديث النتيجة.';$('breakdown').replaceChildren();return;}
 let total=0,active=0,priced=0,invalid=false;const byGroup={};
 rows.forEach((r,i)=>{
  const q=Number(r.qty), rate=Number(r.rate);const valid=r.qty!==''&&Number.isFinite(q)&&q>=0&&q<=1e9&&(r.rate===''||(Number.isFinite(rate)&&rate>=0&&rate<=1e9));
  let cost=0;
  if(r.on){if(!valid)invalid=true;if(q>0){active++;if(r.rate!==''&&valid){priced++;cost=q*rate;total+=cost;byGroup[r.group]=(byGroup[r.group]||0)+cost;}}}
  const cell=$('line-'+i);if(cell)cell.textContent=!r.on?'مستبعد':!valid?'راجع القيمة':q===0?'كمية صفر':r.rate===''?'غير مسعّر':number(cost);
 });
 $('demoBanner').hidden=!demoMode;
 $('totalLabel').textContent=demoMode?'مثال تعليمي فقط + الاحتياطي':'إجمالي البنود المسعّرة + الاحتياطي';
 if(invalid){['grand','perMeter','subtotal','reserveAmount'].forEach(id=>$(id).textContent='—');$('coverage').textContent='فيه كمية أو سعر غير صالح في بند مشمول. صححه الأول.';$('breakdown').replaceChildren();return;}
 const reserve=total*v.reserve/100,grand=total+reserve;
 $('grand').textContent=number(grand);$('subtotal').textContent=number(total);$('reserveAmount').textContent=number(reserve);$('perMeter').textContent=number(grand/v.area);$('moneyLabel').textContent=$('currency').value;
 $('coverage').textContent=`تم تسعير ${priced} من ${active} بند مشمول بكمية أكبر من صفر. ${active-priced?'النتيجة جزئية؛ فيه بنود لسه من غير سعر.':'راجع النطاق والكميات قبل الاعتماد.'}`;
 $('breakdown').replaceChildren();
 for(const g of groups){const item=document.createElement('div');const label=document.createElement('span');label.textContent=g;const amount=document.createElement('b');amount.textContent=number(byGroup[g]||0);item.append(label,amount);$('breakdown').append(item);}
 $('printDate').textContent='تاريخ التقدير: '+new Date().toLocaleDateString('ar-EG')+' | العملة: '+$('currency').value+(demoMode?' | أسعار مثال تعليمي غير سوقية':' | الأسعار أدخلها المستخدم');
}
function rebuild(first=false){
 let v;try{v=readInputs();}catch(e){$('validation').textContent=e.message;return;}
 if(!first&&!confirm('تحديث كل الكميات المحسوبة من الأبعاد؟ الكميات اليدوية ستُستبدل، والأسعار والبنود المخصصة لن تتغير.'))return;
 if(first)rows=definitions.map(d=>({name:d[0],unit:d[1],group:d[2],qty:d[3](v),rate:'',on:d[5]}));
 else definitions.forEach((d,i)=>rows[i].qty=d[3](v));
 dimensionsDirty=false;render();
}
$('rebuild').addEventListener('click',()=>rebuild());
$('demo').addEventListener('click',()=>{if(!confirm('دي أسعار تعليمية افتراضية مش أسعار سوق. هتستبدل كل أسعارك الحالية. تكمّل؟'))return;definitions.forEach((d,i)=>rows[i].rate=d[4]);demoMode=true;render();});
$('clear').addEventListener('click',()=>{if(!confirm('مسح كل أسعار البنود؟'))return;rows.forEach(r=>r.rate='');demoMode=false;render();});
$('add').addEventListener('click',()=>{rows.push({name:'بند إضافي',unit:'مقطوعية',group:'تجهيزات إضافية',qty:1,rate:'',on:true,custom:true});render();});
for(const id of ['area','wet','baths','doors','windows','wallFactor','wallTiles','reserve','currency'])$(id).addEventListener('input',()=>{if(!['reserve','currency'].includes(id))dimensionsDirty=true;calculate();});
$('print').addEventListener('click',()=>{calculate();if($('grand').textContent==='—'){alert('صحح القيم قبل الطباعة.');return;}window.print();});
window.addEventListener('beforeprint',()=>{document.querySelectorAll('details').forEach(d=>{d.dataset.wasOpen=d.open;d.open=true;});});
window.addEventListener('afterprint',()=>{document.querySelectorAll('details').forEach(d=>d.open=d.dataset.wasOpen==='true');});
rebuild(true);
