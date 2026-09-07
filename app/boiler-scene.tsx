'use client';
import {forwardRef,useEffect,useImperativeHandle,useRef,useState} from 'react';
import * as THREE from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls.js';
import {RoundedBoxGeometry} from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import {RoomEnvironment} from 'three/examples/jsm/environments/RoomEnvironment.js';
import {createExplosionLayout} from './explosion-layout';
import {PointerTap} from './pointer-tap';
import {parts,pieceCatalog,type PartId} from './boiler-parts';

export type SceneHandle={zoom:(factor:number)=>void;reset:()=>void};
type Props={focusedMesh:string;onInspect:(id:string)=>void;selected:PartId;explode:number;labels:boolean;autoRotate:boolean;isolated:boolean;onSelect:(id:PartId)=>void};

type Piece={node:THREE.Object3D;home:THREE.Vector3;part:PartId;id:string;label:string;bounds:THREE.Box3;center:THREE.Vector3;fullSpread:THREE.Vector3;materials:THREE.MeshStandardMaterial[]};

const offsets:Record<PartId,[number,number,number]>={
 shell:[0,1.65,0],furnace:[0,-1.45,0],tubes:[0,.15,1.75],burner:[-1.85,0,0],smokebox:[1.8,.15,0],watersteam:[0,1.5,-1.05],valves:[0,2.05,.95],base:[0,-1.55,-.75]
};
const anchors:Record<PartId,[number,number,number]>={
 shell:[0,1.22,.7],furnace:[0,-.35,.48],tubes:[.4,.65,.75],burner:[-2.8,.1,.55],smokebox:[2.25,.35,.62],watersteam:[.15,1.3,-.15],valves:[.65,1.72,.35],base:[0,-1.22,.72]
};

const BoilerScene=forwardRef<SceneHandle,Props>(function BoilerScene(props,ref){
 const host=useRef<HTMLDivElement>(null);const latest=useRef(props);latest.current=props;
 const engine=useRef<{camera:THREE.PerspectiveCamera;controls:OrbitControls;reset:()=>void;interrupt:()=>void}|null>(null);
 const [error,setError]=useState<string|null>(null);const [ready,setReady]=useState(false);
 useImperativeHandle(ref,()=>({zoom(f){const e=engine.current;if(e){e.interrupt();e.camera.position.sub(e.controls.target).multiplyScalar(f).add(e.controls.target)}},reset(){engine.current?.reset()}}),[]);

 useEffect(()=>{
  setReady(false);setError(null);const el=host.current!;let renderer:THREE.WebGLRenderer;
  try{renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'high-performance'})}catch{setError('El navegador no pudo iniciar la vista 3D.');return}
  renderer.setPixelRatio(Math.min(window.devicePixelRatio,window.matchMedia('(pointer: coarse)').matches?1.2:1.5));renderer.setClearColor(0x000000,0);renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.05;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.shadowMap.autoUpdate=false;el.appendChild(renderer.domElement);
  const scene=new THREE.Scene();scene.background=new THREE.Color('#050607');scene.fog=new THREE.Fog('#050607',15,48);
  const camera=new THREE.PerspectiveCamera(38,1,.05,250);camera.position.set(-7.4,3.7,7.2);
  const controls=new OrbitControls(camera,renderer.domElement);controls.target.set(0,.05,0);controls.enableDamping=true;controls.dampingFactor=.065;controls.minDistance=3.2;controls.maxDistance=100;controls.maxPolarAngle=Math.PI*.49;controls.minPolarAngle=.14;controls.enablePan=true;controls.autoRotateSpeed=.55;
  let framingTime=0;let invalidated=true;
  const interrupt=()=>{framingTime=0};
  engine.current={camera,controls,reset:()=>{fitView(true);invalidated=true},interrupt};
  controls.addEventListener('start',interrupt);

  const pmrem=new THREE.PMREMGenerator(renderer);const room=new RoomEnvironment();const env=pmrem.fromScene(room,.04);scene.environment=env.texture;
  scene.add(new THREE.HemisphereLight(0xdce9f2,0x3c3430,1.0));
  const key=new THREE.DirectionalLight(0xffffff,3.2);key.position.set(-5,8,5);key.castShadow=true;key.shadow.mapSize.set(1024,1024);key.shadow.camera.left=-8;key.shadow.camera.right=8;key.shadow.camera.top=8;key.shadow.camera.bottom=-8;key.shadow.bias=-.001;scene.add(key);
  const rim=new THREE.DirectionalLight(0x86b9db,2.0);rim.position.set(4,5,-6);scene.add(rim);
  const warm=new THREE.PointLight(0xff9b55,4.0,12);warm.position.set(-1.6,-.2,1.1);scene.add(warm);

  const mat=(color:string,metal=.35,rough=.34)=>new THREE.MeshStandardMaterial({color,metalness:metal,roughness:rough});
  const steel=mat('#9aa7b0',.82,.24),darkSteel=mat('#263039',.72,.3),jacket=mat('#273746',.6,.25),insulation=mat('#c5b898',.05,.85),tubeMat=mat('#8c999f',.78,.27),black=mat('#11161a',.42,.32),orange=mat('#dc6f2f',.48,.32),brass=mat('#b98d47',.8,.28),red=mat('#9e332c',.4,.36),glass=new THREE.MeshPhysicalMaterial({color:'#b9e7ef',metalness:0,roughness:.08,transparent:true,opacity:.45,transmission:.15,thickness:.2});

  const groups={} as Record<PartId,THREE.Group>;parts.forEach(p=>{const g=new THREE.Group();g.name=p.id;g.userData.part=p.id;groups[p.id]=g;scene.add(g)});
  const pieces:Piece[]=[];
  const meshesForRaycast:THREE.Mesh[]=[];

  function register(part:PartId,id:string,label:string,node:THREE.Object3D){
   node.userData.part=part;node.userData.component=id;node.userData.label=label;
   const materials:THREE.MeshStandardMaterial[]=[];
   const prepareMesh=(o:THREE.Mesh)=>{o.userData.part=part;o.userData.component=id;o.userData.label=label;o.castShadow=true;o.receiveShadow=true;meshesForRaycast.push(o);const ms=Array.isArray(o.material)?o.material:[o.material];o.material=Array.isArray(o.material)?ms.map(m=>m.clone()):ms[0].clone();(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>{if(m instanceof THREE.MeshStandardMaterial){materials.push(m);m.envMapIntensity=1.25;m.userData.baseEmission=m.emissive.clone();m.userData.baseIntensity=m.emissiveIntensity}})};
   node.traverse(o=>{if(o instanceof THREE.Mesh)prepareMesh(o)});
   groups[part].add(node);const rec:Piece={node,home:node.position.clone(),part,id,label,bounds:new THREE.Box3(),center:new THREE.Vector3(),fullSpread:new THREE.Vector3(),materials};pieces.push(rec);node.userData._piece=rec;node.userData._prepareMesh=prepareMesh;
   return node;
  }
  function meshNode(geo:THREE.BufferGeometry,m:THREE.Material,pos:[number,number,number]=[0,0,0],rot:[number,number,number]=[0,0,0]){const o=new THREE.Mesh(geo,m);o.position.set(...pos);o.rotation.set(...rot);return o}
  function pieceMesh(part:PartId,id:string,label:string,geo:THREE.BufferGeometry,m:THREE.Material,pos:[number,number,number]=[0,0,0],rot:[number,number,number]=[0,0,0]){return register(part,id,label,meshNode(geo,m,pos,rot))}
  function pieceGroup(part:PartId,id:string,label:string,pos:[number,number,number]=[0,0,0]){const g=new THREE.Group();g.position.set(...pos);register(part,id,label,g);return g}
  function child(g:THREE.Group,geo:THREE.BufferGeometry,m:THREE.Material,pos:[number,number,number]=[0,0,0],rot:[number,number,number]=[0,0,0]){const o=meshNode(geo,m,pos,rot);g.add(o);const prepare=g.userData._prepareMesh as ((mesh:THREE.Mesh)=>void)|undefined;if(prepare)prepare(o);return o}
  const cylX=(r:number,len:number,segments=40)=>new THREE.CylinderGeometry(r,r,len,segments);
  const cylY=(r:number,len:number,segments=36)=>new THREE.CylinderGeometry(r,r,len,segments);
  const cylZ=(r:number,len:number,segments=36)=>new THREE.CylinderGeometry(r,r,len,segments);
  const box=(x:number,y:number,z:number,r=.03)=>new RoundedBoxGeometry(x,y,z,3,r);
  const torusX=(r:number,tube:number)=>new THREE.TorusGeometry(r,tube,12,56);

  // --- Cuerpo, aislamiento y casco a presión ---
  const L=4.25;
  for(let i=0;i<4;i++){
   const start=i*Math.PI/2+.02,span=Math.PI/2-.04;
   pieceMesh('shell',`shell_jacket_${i}`,`Panel de chaqueta ${i+1}`,new THREE.CylinderGeometry(1.29,1.29,L,64,1,true,start,span),jacket,[0,.1,0],[0,0,Math.PI/2]);
   pieceMesh('shell',`shell_insulation_${i}`,`Sector de aislamiento ${i+1}`,new THREE.CylinderGeometry(1.225,1.225,L,64,1,true,start,span),insulation,[0,.1,0],[0,0,Math.PI/2]);
   pieceMesh('shell',`shell_pressure_${i}`,`Sector de casco a presión ${i+1}`,new THREE.CylinderGeometry(1.14,1.14,L,64,1,true,start,span),darkSteel,[0,.1,0],[0,0,Math.PI/2]);
  }
  [-1.78,-.9,0,.9,1.78].forEach((x,i)=>pieceMesh('shell',`shell_hoop_${i}`,`Anillo exterior ${i+1}`,torusX(1.3,.028),steel,[x,.1,0],[0,Math.PI/2,0]));
  pieceMesh('shell','shell_front_tubesheet','Placa tubular frontal',new THREE.CylinderGeometry(1.105,1.105,.055,64),steel,[-2.08,.1,0],[0,0,Math.PI/2]);
  pieceMesh('shell','shell_rear_tubesheet','Placa tubular posterior',new THREE.CylinderGeometry(1.105,1.105,.055,64),steel,[2.08,.1,0],[0,0,Math.PI/2]);
  const manway=pieceGroup('shell','shell_manway','Tapa de registro superior',[.25,1.27,0]);child(manway,new THREE.CylinderGeometry(.25,.25,.08,36),steel,[0,0,0],[0,0,0]);child(manway,new THREE.TorusGeometry(.26,.025,10,36),darkSteel,[0,.045,0],[Math.PI/2,0,0]);

  // --- Hogar ---
  pieceMesh('furnace','furnace_tube','Tubo de llama / hogar',cylX(.45,3.82,56),darkSteel,[0,-.29,0],[0,0,Math.PI/2]);
  pieceMesh('furnace','furnace_ring_front','Anillo frontal del hogar',torusX(.45,.045),steel,[-1.91,-.29,0],[0,Math.PI/2,0]);
  pieceMesh('furnace','furnace_ring_rear','Anillo posterior del hogar',torusX(.45,.045),steel,[1.91,-.29,0],[0,Math.PI/2,0]);
  pieceMesh('furnace','furnace_refractory','Refractario frontal',new THREE.CylinderGeometry(.39,.39,.13,48),new THREE.MeshStandardMaterial({color:'#d2b08a',metalness:0,roughness:.9}),[-1.98,-.29,0],[0,0,Math.PI/2]);

  // --- Haz tubular: 45 tubos distribuidos alrededor del hogar ---
  const tubePositions:[number,number][]=[];
  for(const y of [.8,.6,.4,.2,0,-.2,-.4,-.6,-.8]) for(const z of [-.8,-.6,-.4,-.2,0,.2,.4,.6,.8]){
   if(Math.hypot(y,z)<.99 && Math.hypot(y+.28,z)>.55) tubePositions.push([y,z]);
  }
  tubePositions.slice(0,45).forEach(([y,z],i)=>pieceMesh('tubes',`tube_${String(i+1).padStart(2,'0')}`,`Tubo de humo ${String(i+1).padStart(2,'0')}`,cylX(.045,3.86,24),tubeMat,[0,y+.1,z],[0,0,Math.PI/2]));

  // --- Quemador ---
  pieceMesh('burner','burner_body','Cuerpo del quemador',cylX(.34,.58,44),black,[-2.43,-.29,0],[0,0,Math.PI/2]);
  pieceMesh('burner','burner_cone','Cono de llama',new THREE.CylinderGeometry(.19,.32,.42,44),darkSteel,[-2.05,-.29,0],[0,0,-Math.PI/2]);
  pieceMesh('burner','burner_diffuser','Difusor',new THREE.CylinderGeometry(.22,.22,.055,32),steel,[-1.87,-.29,0],[0,0,Math.PI/2]);
  const motor=pieceGroup('burner','burner_motor','Motor eléctrico',[-2.58,.35,.0]);child(motor,cylX(.22,.5),darkSteel,[0,0,0],[0,0,Math.PI/2]);child(motor,cylX(.235,.08),steel,[-.28,0,0],[0,0,Math.PI/2]);for(let j=-3;j<=3;j++)child(motor,box(.33,.018,.035,.004),steel,[0,j*.04,.205]);
  const fan=pieceGroup('burner','burner_fan','Ventilador',[-2.72,.02,0]);child(fan,new THREE.CylinderGeometry(.48,.48,.22,48),jacket,[0,0,0],[0,0,Math.PI/2]);child(fan,new THREE.CylinderGeometry(.34,.34,.24,48),black,[0,0,0],[0,0,Math.PI/2]);for(let a=0;a<8;a++){const blade=child(fan,box(.03,.26,.08,.01),steel,[0,0,0]);blade.rotation.x=a*Math.PI/4;blade.position.x=-.13;}
  pieceMesh('burner','burner_airbox','Caja de aire',box(.62,.55,.62,.07),jacket,[-2.42,.02,0]);
  pieceMesh('burner','burner_fuel_pipe','Tubería de combustible',cylY(.035,.95,20),brass,[-2.62,.52,.5]);
  const train=pieceGroup('burner','burner_gas_train','Tren de combustible',[-2.62,.82,.5]);child(train,box(.18,.18,.18,.025),brass,[0,0,0]);child(train,cylZ(.045,.5,20),brass,[0,0,.27],[Math.PI/2,0,0]);
  const ign=pieceGroup('burner','burner_igniter','Encendedor',[-2.09,-.02,.33]);child(ign,cylX(.025,.5,16),orange,[0,0,0],[0,0,Math.PI/2]);child(ign,box(.12,.11,.09,.015),black,[-.25,0,0]);

  // --- Cámaras de humo y chimenea ---
  pieceMesh('smokebox','smokebox_front','Cámara frontal de humos',cylX(1.02,.38,56),black,[-2.27,.1,0],[0,0,Math.PI/2]);
  const frontDoor=pieceGroup('smokebox','smokebox_front_door','Puerta frontal',[-2.5,.1,0]);child(frontDoor,new THREE.CylinderGeometry(1.03,1.03,.075,56),jacket,[0,0,0],[0,0,Math.PI/2]);for(let a=0;a<8;a++)child(frontDoor,cylX(.027,.12,14),steel,[0,.88*Math.cos(a*Math.PI/4),.88*Math.sin(a*Math.PI/4)],[0,0,Math.PI/2]);
  pieceMesh('smokebox','smokebox_rear','Cámara posterior de humos',cylX(1.02,.42,56),black,[2.29,.1,0],[0,0,Math.PI/2]);
  const rearDoor=pieceGroup('smokebox','smokebox_rear_door','Puerta posterior',[2.54,.1,0]);child(rearDoor,new THREE.CylinderGeometry(1.03,1.03,.075,56),jacket,[0,0,0],[0,0,Math.PI/2]);for(let a=0;a<8;a++)child(rearDoor,cylX(.027,.12,14),steel,[0,.88*Math.cos(a*Math.PI/4),.88*Math.sin(a*Math.PI/4)],[0,0,Math.PI/2]);
  pieceMesh('smokebox','smokebox_stack_base','Base de chimenea',new THREE.CylinderGeometry(.22,.33,.28,32),darkSteel,[1.72,1.17,0],[0,0,0]);
  pieceMesh('smokebox','smokebox_stack','Chimenea',cylY(.22,1.6,36),darkSteel,[1.72,2.05,0]);
  const cleanout=pieceGroup('smokebox','smokebox_cleanout','Registro de limpieza',[2.56,-.62,.35]);child(cleanout,new THREE.CylinderGeometry(.18,.18,.06,28),steel,[0,0,0],[0,0,Math.PI/2]);child(cleanout,cylX(.028,.12,12),black,[.07,0,0],[0,0,Math.PI/2]);

  // --- Circuito de agua y vapor ---
  pieceMesh('watersteam','water_feed_pipe','Tubería de alimentación',cylZ(.045,1.2,22),steel,[.85,.2,-1.48],[Math.PI/2,0,0]);
  const feedValve=pieceGroup('watersteam','water_feed_valve','Válvula de alimentación',[.85,.2,-.9]);child(feedValve,cylZ(.07,.28,24),brass,[0,0,0],[Math.PI/2,0,0]);child(feedValve,new THREE.TorusGeometry(.16,.02,8,28),red,[0,.16,0],[Math.PI/2,0,0]);child(feedValve,cylY(.025,.28,14),steel,[0,.02,0]);
  pieceMesh('watersteam','water_feed_nozzle','Boquilla de alimentación',cylZ(.09,.38,26),steel,[.85,.2,-.57],[Math.PI/2,0,0]);
  pieceMesh('watersteam','steam_nozzle','Boquilla de vapor',cylY(.14,.4,32),steel,[.1,1.33,-.12]);
  const header=pieceGroup('watersteam','steam_header','Colector de vapor',[.1,1.63,-.12]);child(header,cylY(.16,.52,32),steel,[0,0,0]);child(header,cylZ(.11,.62,28),steel,[0,.26,.26],[Math.PI/2,0,0]);
  pieceMesh('watersteam','blowdown_pipe','Tubería de purga',cylY(.05,.7,20),steel,[.65,-1.15,0]);
  const blow=pieceGroup('watersteam','blowdown_valve','Válvula de purga',[.65,-1.45,0]);child(blow,cylY(.09,.25,22),brass,[0,0,0]);child(blow,new THREE.TorusGeometry(.17,.02,8,28),red,[0,-.16,0],[Math.PI/2,0,0]);child(blow,cylY(.025,.3,14),steel,[0,0,0]);

  // --- Seguridad e instrumentación ---
  function safetyValve(id:string,label:string,x:number){const g=pieceGroup('valves',id,label,[x,1.5,.42]);child(g,cylY(.075,.34,24),brass,[0,0,0]);child(g,new THREE.CylinderGeometry(.13,.09,.16,24),brass,[0,.22,0]);child(g,cylY(.035,.22,18),steel,[0,.38,0]);child(g,new THREE.TorusGeometry(.11,.018,8,26),red,[0,.49,0],[Math.PI/2,0,0]);}
  safetyValve('safety_valve_1','Válvula de seguridad 1',.52);safetyValve('safety_valve_2','Válvula de seguridad 2',.84);
  const gauge=pieceGroup('valves','pressure_gauge','Manómetro',[-.62,1.48,.55]);child(gauge,new THREE.CylinderGeometry(.23,.23,.07,40),black,[0,0,0],[0,0,Math.PI/2]);child(gauge,new THREE.CylinderGeometry(.205,.205,.075,40),new THREE.MeshStandardMaterial({color:'#e8ece7',metalness:.05,roughness:.6}),[-.02,0,0],[0,0,Math.PI/2]);child(gauge,box(.01,.12,.012,.002),red,[-.07,.03,0],[0,0,-.6]);
  const siphon=pieceGroup('valves','gauge_siphon','Sifón del manómetro',[-.62,1.25,.36]);child(siphon,new THREE.TorusGeometry(.12,.02,8,28,Math.PI*1.7),steel,[0,0,0],[0,0,Math.PI/2]);child(siphon,cylY(.025,.26,14),steel,[0,.14,0]);
  const lvl=pieceGroup('valves','level_glass','Visor de nivel',[-.95,.62,.82]);child(lvl,cylY(.055,.88,24),glass,[0,0,0]);child(lvl,cylY(.075,.08,22),steel,[0,.48,0]);child(lvl,cylY(.075,.08,22),steel,[0,-.48,0]);
  const lvTop=pieceGroup('valves','level_valve_top','Válvula superior de nivel',[-.95,1.1,.82]);child(lvTop,cylZ(.06,.3,20),brass,[0,0,0],[Math.PI/2,0,0]);child(lvTop,new THREE.TorusGeometry(.12,.018,8,24),red,[0,.11,0],[Math.PI/2,0,0]);
  const lvBot=pieceGroup('valves','level_valve_bottom','Válvula inferior de nivel',[-.95,.14,.82]);child(lvBot,cylZ(.06,.3,20),brass,[0,0,0],[Math.PI/2,0,0]);child(lvBot,new THREE.TorusGeometry(.12,.018,8,24),red,[0,-.11,0],[Math.PI/2,0,0]);
  const guard=pieceGroup('valves','level_guard','Protector del visor',[-.95,.62,.82]);for(const z of [-.11,.11])child(guard,box(.045,.95,.035,.008),steel,[0,0,z]);for(const y of [-.44,.44])child(guard,box(.045,.035,.28,.008),steel,[0,y,0]);
  const ps=pieceGroup('valves','pressure_switch','Presostato',[-.25,1.37,.75]);child(ps,box(.26,.24,.22,.025),jacket,[0,0,0]);child(ps,cylY(.035,.22,14),steel,[0,-.2,0]);

  // --- Bancada y soportes ---
  pieceMesh('base','base_rail_left','Larguero izquierdo',box(5.8,.16,.22,.035),darkSteel,[0,-1.28,-.72]);
  pieceMesh('base','base_rail_right','Larguero derecho',box(5.8,.16,.22,.035),darkSteel,[0,-1.28,.72]);
  pieceMesh('base','base_cross_1','Travesaño frontal',box(.24,.16,1.7,.035),darkSteel,[-2.0,-1.28,0]);
  pieceMesh('base','base_cross_2','Travesaño posterior',box(.24,.16,1.7,.035),darkSteel,[2.0,-1.28,0]);
  function saddle(id:string,label:string,x:number){const g=pieceGroup('base',id,label,[x,-.88,0]);child(g,box(.34,.6,1.75,.05),darkSteel,[0,-.12,0]);child(g,new THREE.TorusGeometry(1.12,.08,12,48,Math.PI),steel,[0,.4,0],[0,Math.PI/2,Math.PI/2]);}
  saddle('base_saddle_front','Cuna frontal',-1.38);saddle('base_saddle_rear','Cuna posterior',1.38);
  [[-2.5,-1.46,-.72],[-2.5,-1.46,.72],[2.5,-1.46,-.72],[2.5,-1.46,.72]].forEach((p,i)=>pieceMesh('base',`base_foot_${i+1}`,`Pie ${i+1}`,box(.42,.18,.4,.04),steel,p as [number,number,number]));

  // Piso / plataforma de exhibición (no explota)
  const platform=new THREE.Mesh(new THREE.CylinderGeometry(4.25,4.25,.18,96),new THREE.MeshStandardMaterial({color:'#0b0f12',metalness:.55,roughness:.28}));platform.position.y=-1.62;platform.receiveShadow=true;scene.add(platform);
  const ring=new THREE.Mesh(new THREE.TorusGeometry(3.72,.018,8,96),new THREE.MeshBasicMaterial({color:'#55616a',transparent:true,opacity:.6}));ring.rotation.x=Math.PI/2;ring.position.y=-1.52;scene.add(ring);
  const floor=new THREE.Mesh(new THREE.CircleGeometry(14,96),new THREE.MeshStandardMaterial({color:'#050607',metalness:.05,roughness:.82}));floor.rotation.x=-Math.PI/2;floor.position.y=-1.72;floor.receiveShadow=true;scene.add(floor);

  // Bounds and exploded-card layout.
  scene.updateMatrixWorld(true);for(const piece of pieces){piece.bounds.setFromObject(piece.node);piece.bounds.getCenter(piece.center)}
  const layout=createExplosionLayout(pieces.map(p=>({id:p.id,part:p.part,bounds:p.bounds})));
  pieces.forEach(p=>p.fullSpread.copy(layout.pieces.get(p.id)!.translation));
  if(pieceCatalog.length!==pieces.length) console.warn(`Boiler catalog mismatch: metadata ${pieceCatalog.length}, geometry ${pieces.length}`);

  // Labels and numbered piece markers.
  const labelNodes:{b:HTMLButtonElement;id:PartId}[]=[];parts.forEach((p,i)=>{const b=document.createElement('button');b.className='scene-label';b.innerHTML=`<span>${String(i+1).padStart(2,'0')}</span><strong>${p.name}</strong>`;b.addEventListener('click',()=>latest.current.onSelect(p.id));el.appendChild(b);labelNodes.push({b,id:p.id})});
  const pieceLabels:{b:HTMLButtonElement;piece:Piece}[]=[];pieces.forEach((piece,i)=>{const b=document.createElement('button');b.className='mesh-marker numbered';b.textContent=String(i+1);b.title=piece.label;b.setAttribute('aria-label',`Inspeccionar pieza ${i+1}: ${piece.label}`);b.addEventListener('click',()=>{latest.current.onSelect(piece.part);latest.current.onInspect(piece.id)});el.appendChild(b);pieceLabels.push({b,piece})});

  const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2(),tap=new PointerTap();
  const onDown=(e:PointerEvent)=>tap.down(e.pointerId,e.clientX,e.clientY,e.pointerType==='touch'?12:6);
  const onMove=(e:PointerEvent)=>tap.move(e.pointerId,e.clientX,e.clientY);
  const onCancel=(e:PointerEvent)=>tap.cancel(e.pointerId);
  const onUp=(e:PointerEvent)=>{if(!tap.up(e.pointerId,e.clientX,e.clientY))return;const rect=renderer.domElement.getBoundingClientRect();pointer.set(((e.clientX-rect.left)/rect.width)*2-1,-((e.clientY-rect.top)/rect.height)*2+1);raycaster.setFromCamera(pointer,camera);const hit=raycaster.intersectObjects(meshesForRaycast,false).find(h=>h.object.visible);if(hit){const id=hit.object.userData.component as string,part=hit.object.userData.part as PartId;if(id&&part){latest.current.onSelect(part);latest.current.onInspect(id)}}};
  renderer.domElement.addEventListener('pointerdown',onDown);renderer.domElement.addEventListener('pointermove',onMove);renderer.domElement.addEventListener('pointercancel',onCancel);renderer.domElement.addEventListener('pointerup',onUp);

  let viewWidth=1,viewHeight=1;function resize(){const r=el.getBoundingClientRect();viewWidth=Math.max(1,r.width);viewHeight=Math.max(1,r.height);renderer.setSize(viewWidth,viewHeight,false);camera.aspect=viewWidth/viewHeight;camera.updateProjectionMatrix();invalidated=true}
  const observer=new ResizeObserver(resize);observer.observe(el);resize();
  const allBounds=()=>{const b=new THREE.Box3();for(const p of pieces)if(p.node.visible)b.expandByObject(p.node);return b};
  function fitView(animate=false){scene.updateMatrixWorld(true);const b=allBounds();if(b.isEmpty())return;const center=b.getCenter(new THREE.Vector3()),size=b.getSize(new THREE.Vector3());const radius=Math.max(size.x,size.y,size.z)*.58;const fov=THREE.MathUtils.degToRad(camera.fov);const aspect=Math.max(.65,camera.aspect);const dist=Math.max(5.0,radius/(Math.tan(fov/2)*Math.min(1,aspect)))*1.22;const dir=new THREE.Vector3(-1,.42,1).normalize();if(animate){camera.position.copy(center).addScaledVector(dir,dist);controls.target.copy(center);controls.update()}else{camera.position.copy(center).addScaledVector(dir,dist);controls.target.copy(center)}controls.minDistance=Math.max(1.0,radius*.75);framingTime=performance.now()+300}
  fitView(false);setReady(true);renderer.shadowMap.needsUpdate=true;

  let raf=0,lastProps=props,lastHighlighted='';const vector=new THREE.Vector3();let lastLabelUpdate=0,lastShadow=0;
  function frame(now:number){
   const p=latest.current;const changed=p!==lastProps;controls.autoRotate=p.autoRotate&&!p.isolated;controls.update();
   const groupAmount=Math.min(1,p.explode/65);const individual=THREE.MathUtils.smoothstep((p.explode-64)/36,0,1);
   for(const part of parts){const g=groups[part.id];const o=offsets[part.id];g.position.set(o[0]*groupAmount*(1-individual),o[1]*groupAmount*(1-individual),o[2]*groupAmount*(1-individual));g.visible=!p.isolated||p.selected===part.id;}
   for(const piece of pieces){piece.node.position.copy(piece.home).addScaledVector(piece.fullSpread,individual);if(p.isolated&&piece.part===p.selected&&p.focusedMesh)piece.node.visible=piece.id===p.focusedMesh;else piece.node.visible=true;}

   if(p.focusedMesh!==lastHighlighted||changed){for(const piece of pieces)if(piece.id===lastHighlighted||piece.id===p.focusedMesh){for(const m of piece.materials){m.emissive.copy(m.userData.baseEmission||new THREE.Color(0));m.emissiveIntensity=m.userData.baseIntensity||0;if(piece.id===p.focusedMesh){m.emissive.set('#b6522b');m.emissiveIntensity=.28}}}lastHighlighted=p.focusedMesh;}

   if(p.isolated&&changed){const target=p.focusedMesh?pieces.find(x=>x.id===p.focusedMesh)?.node:groups[p.selected];if(target){scene.updateMatrixWorld(true);const b=new THREE.Box3().setFromObject(target);if(!b.isEmpty()){const center=b.getCenter(new THREE.Vector3()),extent=Math.max(.3,b.getSize(new THREE.Vector3()).length());const dir=camera.position.clone().sub(controls.target).normalize();controls.target.copy(center);camera.position.copy(center).addScaledVector(dir,Math.max(.9,extent*1.45));controls.update()}}}else if(!p.isolated&&lastProps.isolated){fitView(true)}

   if(now-lastLabelUpdate>45||changed||invalidated){lastLabelUpdate=now;scene.updateMatrixWorld(true);
    labelNodes.forEach(({b,id})=>{const show=individual<.48&&p.labels&&(!p.isolated||p.selected===id);b.hidden=!show;if(!show)return;const a=anchors[id];vector.set(...a).add(groups[id].position).project(camera);b.style.display=vector.z<1?'flex':'none';b.classList.toggle('chosen',id===p.selected);b.style.transform=`translate3d(${(vector.x*.5+.5)*viewWidth}px,${(-vector.y*.5+.5)*viewHeight}px,0) translate(-12px,-50%)`;});
    pieceLabels.forEach(({b,piece})=>{const show=individual>.42&&(p.labels||piece.id===p.focusedMesh)&&(!p.isolated||p.selected===piece.part)&&(!p.isolated||!p.focusedMesh||p.focusedMesh===piece.id);b.hidden=!show;if(!show)return;const world=new THREE.Box3().setFromObject(piece.node).getCenter(vector).project(camera);b.style.display=world.z<1&&Math.abs(world.x)<1.05&&Math.abs(world.y)<1.05?'grid':'none';b.classList.toggle('chosen',piece.id===p.focusedMesh);b.style.transform=`translate3d(${(world.x*.5+.5)*viewWidth}px,${(-world.y*.5+.5)*viewHeight}px,0) translate(-50%,-50%)`;});
   }
   if((p.autoRotate||changed||invalidated)&&now-lastShadow>90){renderer.shadowMap.needsUpdate=true;lastShadow=now}
   lastProps=p;invalidated=false;renderer.render(scene,camera);raf=requestAnimationFrame(frame);
  }
  raf=requestAnimationFrame(frame);

  const lost=(e:Event)=>{e.preventDefault();setError('La vista 3D perdió el contexto gráfico. Recarga para continuar.')};renderer.domElement.addEventListener('webglcontextlost',lost);
  return()=>{cancelAnimationFrame(raf);observer.disconnect();controls.removeEventListener('start',interrupt);controls.dispose();engine.current=null;labelNodes.forEach(x=>x.b.remove());pieceLabels.forEach(x=>x.b.remove());renderer.domElement.removeEventListener('pointerdown',onDown);renderer.domElement.removeEventListener('pointermove',onMove);renderer.domElement.removeEventListener('pointercancel',onCancel);renderer.domElement.removeEventListener('pointerup',onUp);renderer.domElement.removeEventListener('webglcontextlost',lost);scene.traverse(o=>{if(o instanceof THREE.Mesh){o.geometry.dispose();(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>m.dispose())}});env.dispose();pmrem.dispose();room.dispose();renderer.dispose();renderer.domElement.remove();};
 },[]);
 return <><div ref={host} className="canvas-host" aria-label="Modelo 3D rotatable y explotable de una caldera"/>{!ready&&!error&&<div className="scene-loading"><span/>Construyendo la caldera 3D…</div>}{error&&<div className="scene-error"><h3>La vista 3D necesita recargarse.</h3><p>{error}</p><button onClick={()=>location.reload()}>Recargar</button></div>}</>;
});
export default BoilerScene;
