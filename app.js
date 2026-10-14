const content={
  cultura:{
    tag:'CULTURA & TRADICIÓN BARBERA',
    title:'El arte del barbero,\nla precisión del corte.',
    text:'En NEXOCITA Barber Studio fusionamos la artesanía tradicional de la toalla caliente y navaja de barbero con los cortes modernos más exigentes. Cada detalle cuenta.',
    detail:'Maestros barberos · Navaja de afeitar · Toalla al vapor',
    image:'assets/barber-6.jpg',
    alt:'Barbero profesional realizando corte de precisión con tijera y toalla al vapor'
  },
  naturaleza:{
    tag:'CUIDADO FACIAL & CAPILAR',
    title:'Productos premium,\naceites y bálsamos naturales.',
    text:'Protegemos la piel y el cabello de nuestros clientes con pomadas al agua, aceites para barba con esencias naturales y lociones astringentes que evitan la irritación tras el afeitado.',
    detail:'Tratamientos sin sulfatos · Cuidado de la piel',
    image:'assets/barber-4.jpg',
    alt:'Ritual de afeitado clásico a navaja con toalla caliente'
  },
  tecnologia:{
    tag:'RESERVAS ONLINE SIN FILAS',
    title:'Tu silla garantizada.\nCero esperas, cero demoras.',
    text:'Con el sistema de reservas NEXOCITA eliges tu horario favorito desde cualquier dispositivo. Llegas, te sientas y disfrutas de tu corte sin pérdidas de tiempo.',
    detail:'Confirmación instantánea · Comprobante con código privado',
    image:'assets/barber-1.jpg',
    alt:'Cliente satisfecho con corte de cabello degradado moderno'
  }
};
const tabs=[...document.querySelectorAll('[role=tab]')];
function selectCategory(tab){
  tabs.forEach(t=>{t.setAttribute('aria-selected',String(t===tab));t.tabIndex=t===tab?0:-1});
  const item=content[tab.dataset.category];
  if(!item)return;
  document.querySelector('#category-tag').textContent=item.tag;
  const title=document.querySelector('#category-title');
  title.textContent=item.title;
  title.style.whiteSpace='pre-line';
  document.querySelector('#category-text').textContent=item.text;
  document.querySelector('#category-detail').textContent=item.detail;
  const img=document.querySelector('#category-image');
  img.src=item.image;
  img.alt=item.alt;
  document.querySelector('#category-panel').setAttribute('aria-labelledby',tab.id);
}
tabs.forEach((tab,index)=>{
  tab.addEventListener('click',()=>selectCategory(tab));
  tab.addEventListener('keydown',e=>{
    let target;
    if(e.key==='ArrowRight')target=(index+1)%tabs.length;
    if(e.key==='ArrowLeft')target=(index+tabs.length-1)%tabs.length;
    if(e.key==='Home')target=0;
    if(e.key==='End')target=tabs.length-1;
    if(target!==undefined){e.preventDefault();tabs[target].focus();selectCategory(tabs[target])}
  });
});

const cards=[...document.querySelectorAll('.gallery-card')],dialog=document.querySelector('#lightbox');let currentImage=0;
function showImage(index){
  currentImage=(index+cards.length)%cards.length;
  const card=cards[currentImage];
  const cardImg=card.querySelector('img');
  const lbImg=document.querySelector('#lightbox-image');
  lbImg.src=cardImg ? cardImg.src : `assets/barber-${currentImage+1}.jpg`;
  lbImg.alt=cardImg ? cardImg.alt : card.dataset.title;
  document.querySelector('#lightbox-title').textContent=`${currentImage+1} / ${cards.length} · ${card.dataset.title || 'Trabajo de Barbería'}`;
}
cards.forEach((card,index)=>card.addEventListener('click',()=>{showImage(index);dialog.showModal();document.body.style.overflow='hidden'}));
document.querySelector('.close-dialog').addEventListener('click',()=>dialog.close());
dialog.addEventListener('close',()=>{document.body.style.overflow=''});
dialog.addEventListener('click',e=>{
  if(e.target===dialog){
    const rect=dialog.getBoundingClientRect();
    if(e.clientX<rect.left||e.clientX>rect.right||e.clientY<rect.top||e.clientY>rect.bottom)dialog.close();
  }
});
document.querySelector('#previous-image').addEventListener('click',()=>showImage(currentImage-1));
document.querySelector('#next-image').addEventListener('click',()=>showImage(currentImage+1));
dialog.addEventListener('keydown',e=>{
  if(e.key==='ArrowRight')showImage(currentImage+1);
  if(e.key==='ArrowLeft')showImage(currentImage-1);
});

const wave=document.querySelector('.waveform');
if(wave){
  for(let i=0;i<43;i++){
    const bar=document.createElement('i');
    bar.style.setProperty('--height',`${12+Math.abs(Math.sin(i*1.3)*Math.cos(i*.34))*62}px`);
    bar.style.setProperty('--delay',`${(i%7)*.1}s`);
    wave.append(bar);
  }
}
const audio=document.querySelector('audio'),video=document.querySelector('video');
if(audio){
  audio.addEventListener('play',()=>{if(video)video.pause();document.querySelector('.audio-card')?.classList.add('playing')});
  ['pause','ended'].forEach(event=>audio.addEventListener(event,()=>document.querySelector('.audio-card')?.classList.remove('playing')));
}
if(video){
  video.addEventListener('play',()=>{if(audio)audio.pause()});
}

const navigation=[...document.querySelectorAll('.nav-links a')];
const observer=new IntersectionObserver(entries=>{
  entries.forEach(entry=>{
    if(entry.isIntersecting){
      navigation.forEach(a=>{
        if(a.hash===`#${entry.target.id}`)a.setAttribute('aria-current','page');
        else a.removeAttribute('aria-current');
      });
    }
  });
},{rootMargin:'-15% 0px -45% 0px',threshold:0});
navigation.forEach(a=>{if(a.hash){const el=document.querySelector(a.hash);if(el)observer.observe(el)}});

// Selector interactivo de servicios de barbería desde el catálogo
window.selectBarberService=function(serviceId){
  const select=document.querySelector('#service');
  if(select){
    select.value=String(serviceId);
    select.dispatchEvent(new Event('change'));
  }
  const form=document.querySelector('#booking-form');
  if(form){
    form.scrollIntoView({behavior:'smooth',block:'center'});
    const dateInput=document.querySelector('#date');
    if(dateInput)setTimeout(()=>dateInput.focus(),400);
  }
};

