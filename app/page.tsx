'use client';
import {flushSync} from 'react-dom';
import {useEffect,useRef,useState} from 'react';
import {Box,Layers3,RotateCcw,Rotate3d,Plus,Minus,Maximize2,X,Crosshair,ChevronRight,CircleHelp,Expand,MoreHorizontal} from 'lucide-react';
import {Select,SelectTrigger,SelectValue,SelectContent,SelectItem} from '@/components/ui/select';
import {Slider} from '@/components/ui/slider';
import {Switch} from '@/components/ui/switch';
import {Tabs,TabsList,TabsTrigger} from '@/components/ui/tabs';
import {parts,pieceCatalog,describePiece,type PartId} from './boiler-parts';
import BoilerScene,{type SceneHandle} from './boiler-scene';

export default function Home(){
 const [selected,setSelected]=useState<PartId>('shell');
 const [canFullscreen,setCanFullscreen]=useState(false);
 const [compact,setCompact]=useState(false);const [toolsOpen,setToolsOpen]=useState(false);
 const [componentsOpen,setComponentsOpen]=useState(false);const [detailOpen,setDetailOpen]=useState(false);
 const [explode,setExplode]=useState(0);const [labels,setLabels]=useState(false);const [rotate,setRotate]=useState(false);const [isolated,setIsolated]=useState(false);const [help,setHelp]=useState(false);
 const [focusedMesh,setFocusedMesh]=useState('');const [tab,setTab]=useState('overview');
 const scene=useRef<SceneHandle|null>(null);const root=useRef<HTMLDivElement>(null);

 useEffect(()=>{setCanFullscreen(Boolean(document.fullscreenEnabled));const query=window.matchMedia('(max-width: 700px), (max-height: 500px)');const update=()=>{setCompact(query.matches);setComponentsOpen(!query.matches);setToolsOpen(false)};update();query.addEventListener('change',update);return()=>query.removeEventListener('change',update)},[]);
 useEffect(()=>{
  const context=(document as Document & {modelContext?:{registerTool:(tool:unknown,options:{signal:AbortSignal})=>unknown}}).modelContext;if(!context?.registerTool)return;
  const lifecycle=new AbortController();
  try{Promise.resolve(context.registerTool({name:'explore_boiler_component',description:'Selecciona un sistema de la caldera, define el nivel de explosión y opcionalmente aísla el componente en el estudio 3D.',inputSchema:{type:'object',properties:{component:{type:'string',enum:parts.map(p=>p.id)},explosion:{type:'number',minimum:0,maximum:100},isolate:{type:'boolean'}},required:['component'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute(input:unknown){const v=input as {component:PartId;explosion?:number;isolate?:boolean};if(!v||!parts.some(p=>p.id===v.component)||(v.explosion!==undefined&&(typeof v.explosion!=='number'||!Number.isFinite(v.explosion)||v.explosion<0||v.explosion>100))||(v.isolate!==undefined&&typeof v.isolate!=='boolean'))throw new Error('Selecciona un componente válido y una explosión entre 0 y 100.');flushSync(()=>{setSelected(v.component);setFocusedMesh('');setDetailOpen(true);setTab('overview');if(window.matchMedia('(max-width: 700px), (max-height: 500px)').matches){setComponentsOpen(false);setHelp(false)}if(v.explosion!==undefined)setExplode(v.explosion);if(v.isolate!==undefined)setIsolated(v.isolate)});return {component:v.component,description:parts.find(p=>p.id===v.component)!.description};}},{signal:lifecycle.signal})).catch(()=>{})}catch{}
  return()=>lifecycle.abort();
 },[]);

 const part=parts.find(p=>p.id===selected)!;const piece=pieceCatalog.find(p=>p.id===focusedMesh);
 function select(id:PartId){setFocusedMesh('');setSelected(id);setTab('overview');setDetailOpen(true);if(compact){setComponentsOpen(false);setHelp(false);setToolsOpen(false)}}
 function toggleComponents(){setComponentsOpen(!componentsOpen);if(compact){setDetailOpen(false);setHelp(false);setToolsOpen(false)}}
 function toggleHelp(){setHelp(!help);if(compact){setComponentsOpen(false);setDetailOpen(false);setToolsOpen(false)}}

 return <main className="studio" ref={root}>
  <section className="stage-view" aria-label="Estudio interactivo de caldera industrial">
   <BoilerScene focusedMesh={focusedMesh} onInspect={setFocusedMesh} ref={scene} selected={selected} explode={explode} labels={labels} autoRotate={rotate} isolated={isolated} onSelect={select}/>
  </section>

  <div className="model-plaque"><span>B O I L E R &nbsp; S T U D I O</span><h1>CALDERA PIROTUBULAR</h1></div>

  {componentsOpen&&<aside className="components-panel floating-panel" aria-label="Sistemas">
   <div className="panel-heading"><h2>Sistemas</h2><button className="icon-button" onClick={()=>setComponentsOpen(false)} aria-label="Ocultar sistemas"><X size={14}/></button></div>
   <div className="parts-list">{parts.map((p,i)=><button key={p.id} onClick={()=>select(p.id)} className={'part-row '+(p.id===selected&&detailOpen?'selected':'')} aria-pressed={p.id===selected&&detailOpen}><span className="part-number">{String(i+1).padStart(2,'0')}</span><span>{p.name}</span><ChevronRight size={13}/></button>)}</div>
  </aside>}

  <nav className="view-tools floating-panel" data-expanded={toolsOpen} aria-label="Controles de vista">
   <button className={'tools-components '+(componentsOpen?'active':'')} title="Sistemas" onClick={toggleComponents} aria-label="Mostrar u ocultar sistemas" aria-pressed={componentsOpen}><Layers3 size={18}/></button><span/>
   <button className="tools-extra" title="Acercar" onClick={()=>scene.current?.zoom(.85)} aria-label="Acercar"><Plus size={18}/></button>
   <button className="tools-extra" title="Alejar" onClick={()=>scene.current?.zoom(1.18)} aria-label="Alejar"><Minus size={18}/></button>
   <button className="tools-reset" title="Restablecer vista" onClick={()=>{setRotate(false);scene.current?.reset()}} aria-label="Restablecer vista"><RotateCcw size={17}/></button>
   <button className={'tools-extra '+(rotate?'active':'')} title="Rotación automática" onClick={()=>setRotate(!rotate)} aria-label="Alternar rotación automática" aria-pressed={rotate}><Rotate3d size={18}/></button><span/>
   {canFullscreen&&<button className="tools-extra" title="Pantalla completa" onClick={()=>{if(document.fullscreenElement)document.exitFullscreen();else root.current?.requestFullscreen?.()}} aria-label="Pantalla completa"><Maximize2 size={17}/></button>}
   <button className="tools-extra" title="Acerca del modelo" onClick={toggleHelp} aria-label="Acerca del modelo" aria-expanded={help}><CircleHelp size={17}/></button>
   <button className="tools-more" title="Más controles" onClick={()=>setToolsOpen(!toolsOpen)} aria-label="Más controles" aria-expanded={toolsOpen}><MoreHorizontal size={20}/></button>
  </nav>

  {detailOpen&&<aside className="detail-panel floating-panel" aria-label="Detalle del componente">
   <div className="panel-heading"><span>{part.category}<span className="illustrative-badge">Modelo educativo</span></span><button className="icon-button" onClick={()=>setDetailOpen(false)} aria-label="Cerrar detalle"><X size={16}/></button></div>
   <div className="detail" aria-live="polite">
    <h2>{piece?piece.label:part.name}</h2>
    <Tabs value={tab} onValueChange={v=>setTab(String(v))}><TabsList variant="line" className="detail-tabs"><TabsTrigger value="overview">Descripción</TabsTrigger><TabsTrigger value="working">Cómo funciona</TabsTrigger></TabsList></Tabs>
    <p className="detail-copy">{piece&&tab==='overview'?describePiece(piece.label):tab==='overview'?part.description:part.principle}</p>
    <dl className="specs">{part.specs.map(([a,b])=><div key={a}><dt>{a}</dt><dd>{b}</dd></div>)}</dl>
    <div className="piece-picker"><span>Piezas individuales</span><Select value={focusedMesh||'all'} onValueChange={value=>setFocusedMesh(value==='all'?'':String(value))}><SelectTrigger aria-label="Elegir pieza individual"><SelectValue>{piece?piece.label:`Todas las piezas (${pieceCatalog.filter(p=>p.part===selected).length})`}</SelectValue></SelectTrigger><SelectContent alignItemWithTrigger={false}>{[{id:'all',label:'Todas las piezas del sistema'},...pieceCatalog.filter(p=>p.part===selected)].map((p,i)=><SelectItem key={p.id} value={p.id}>{i?`${String(i).padStart(2,'0')} · `:''}{p.label}</SelectItem>)}</SelectContent></Select></div>
    <button className={'isolate-button '+(isolated?'is-active':'')} onClick={()=>setIsolated(!isolated)}>{isolated?<Layers3 size={15}/>:<Crosshair size={15}/>} {isolated?'Mostrar todo':focusedMesh?'Aislar pieza':'Aislar sistema'}</button>
    <p className="model-note">Representación 3D didáctica. No usar como plano de fabricación, mantenimiento o certificación.</p>
   </div>
  </aside>}

  <div className="explode-dock floating-panel" aria-label="Controles de despiece">
   <button className={'assembly-button '+(explode===0?'active':'')} title="Ensamblar" onClick={()=>{setExplode(0);setIsolated(false)}} aria-label="Ensamblar caldera"><Box size={18}/><span>Ensamblar</span></button>
   <div className="explode-control"><div className="slider-caption"><label id="explode-label">Despiece</label><output>{explode===100?`${pieceCatalog.length} piezas`:`${explode}%`}</output></div><Slider aria-labelledby="explode-label" value={[explode]} onValueChange={v=>setExplode(Array.isArray(v)?v[0]:v)} min={0} max={100}/></div>
   <button className={'assembly-button '+(explode===100?'active':'')} title="Separar todas las piezas" onClick={()=>{setExplode(100);setIsolated(false)}} aria-label="Separar todas las piezas"><Expand size={18}/><span>Todas</span></button>
   <div className="dock-divider"/><label className="labels-toggle"><Switch checked={labels} onCheckedChange={setLabels} aria-label="Mostrar etiquetas"/><span>Etiquetas</span></label>
  </div>

  {help&&<aside className="about-panel floating-panel" aria-label="Acerca del modelo"><div className="panel-heading"><h2>Acerca del modelo</h2><button className="icon-button" onClick={()=>setHelp(false)} aria-label="Cerrar información"><X size={15}/></button></div><p>Arrastra para rotar, usa la rueda o pellizca para zoom. Selecciona un sistema o una pieza, aísla componentes y mueve el control inferior para desmontar progresivamente la caldera.</p><p>La geometría es una representación propia de una caldera industrial pirotubular horizontal. Contiene {pieceCatalog.length} piezas interactivas y está pensada para docencia y visualización, no para ingeniería de detalle.</p></aside>}
 </main>
}
