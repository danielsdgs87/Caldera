export type PartId = 'shell'|'furnace'|'tubes'|'burner'|'smokebox'|'watersteam'|'valves'|'base';

export type PartInfo = {
  id: PartId;
  name: string;
  category: string;
  tag: string;
  description: string;
  principle: string;
  specs: [string,string][];
};

export const parts: PartInfo[] = [
  {id:'shell',name:'Cuerpo y aislamiento',category:'Recipiente a presión',tag:'LA ENVOLVENTE TÉRMICA',description:'El cuerpo cilíndrico contiene el agua y el vapor. Sobre él se disponen aislamiento térmico, chaqueta exterior, tapas y anillos de refuerzo que reducen pérdidas y protegen el recipiente.',principle:'La presión interna es contenida por el casco y los fondos. El aislamiento limita la transferencia de calor hacia el ambiente, mientras la chaqueta protege la capa aislante.',specs:[['Función','Contención y aislamiento'],['Configuración','Casco cilíndrico horizontal'],['Modelo','Educativo, no certificado']]},
  {id:'furnace',name:'Hogar / tubo de llama',category:'Combustión',tag:'DONDE NACE EL CALOR',description:'El hogar es el conducto de mayor diámetro por el que avanza la llama del quemador. Sus paredes reciben radiación directa y transfieren energía al agua que rodea el tubo.',principle:'La combustión libera energía química. La radiación de la llama y la convección de los gases calientes transfieren calor a través de la pared metálica hacia el agua.',specs:[['Transferencia dominante','Radiación + convección'],['Ubicación','Eje inferior del cuerpo'],['Flujo','Gases calientes']]},
  {id:'tubes',name:'Haz de tubos de humo',category:'Intercambio térmico',tag:'SUPERFICIE DE TRANSFERENCIA',description:'Decenas de tubos de pequeño diámetro conducen los gases calientes a través del volumen de agua, aumentando el área disponible para transferir energía.',principle:'Los gases ceden calor por convección a las paredes de los tubos. El agua absorbe esa energía y, al alcanzar las condiciones de saturación, genera vapor.',specs:[['Tipo','Pirotubular'],['Número representado','45 tubos'],['Medio exterior','Agua / vapor']]},
  {id:'burner',name:'Quemador y ventilador',category:'Combustión',tag:'AIRE + COMBUSTIBLE',description:'El conjunto frontal dosifica combustible y aire, los mezcla y estabiliza la llama que ingresa al hogar. Incluye ventilador, motor, difusor y tuberías ilustrativas.',principle:'El ventilador aporta aire de combustión. El combustible se atomiza o mezcla, se enciende y la llama queda confinada en el hogar para liberar calor de forma controlada.',specs:[['Aire','Ventilador forzado'],['Combustible','Representación genérica'],['Control','Modulación ilustrativa']]},
  {id:'smokebox',name:'Cámaras de humos',category:'Ruta de gases',tag:'CAMBIO DE DIRECCIÓN',description:'Las cámaras frontal y posterior reciben los gases al final de cada paso, los redirigen y permiten acceso para inspección y limpieza.',principle:'Los gases cambian de dirección dentro de las cajas de humo antes de entrar al siguiente paso. Las puertas desmontables facilitan mantenimiento del hogar y del haz tubular.',specs:[['Función','Reversión y colecta'],['Acceso','Puertas de inspección'],['Descarga','Conexión a chimenea']]},
  {id:'watersteam',name:'Agua, vapor y alimentación',category:'Circuito de proceso',tag:'DEL AGUA AL VAPOR',description:'La alimentación repone el agua que se transforma en vapor. En la parte superior se acumula vapor antes de salir hacia el proceso.',principle:'El agua recibe calor del hogar y los tubos. Al hervir, las burbujas ascienden y el vapor se separa en la zona superior del recipiente antes de salir por la conexión principal.',specs:[['Entrada','Agua de alimentación'],['Salida','Vapor'],['Purga','Fondo del recipiente']]},
  {id:'valves',name:'Válvulas e instrumentación',category:'Seguridad y control',tag:'MEDIR, PROTEGER, CONTROLAR',description:'Manómetro, visor de nivel, válvulas de seguridad, válvulas de aislamiento y sensores permiten conocer el estado de la caldera y protegerla frente a condiciones anormales.',principle:'La instrumentación mide presión y nivel. Las válvulas de seguridad proporcionan una vía de alivio independiente cuando la presión supera el ajuste establecido.',specs:[['Variables','Presión y nivel'],['Protección','2 válvulas de seguridad'],['Representación','Esquemática educativa']]},
  {id:'base',name:'Bancada y soportes',category:'Estructura',tag:'SOPORTE Y ALINEACIÓN',description:'Dos cunas sostienen el cuerpo cilíndrico y transmiten su peso a una bancada rígida. La base mantiene alineados quemador, recipiente y accesorios.',principle:'Las cargas se distribuyen desde el casco hacia los apoyos y luego a la fundación. En equipos reales, uno de los apoyos puede permitir expansión térmica longitudinal.',specs:[['Apoyos','2 cunas'],['Base','Bastidor metálico'],['Función','Soporte estructural']]},
];

export type PieceInfo = {id:string;part:PartId;label:string};
const pieces: PieceInfo[] = [];
const add=(id:string,part:PartId,label:string)=>pieces.push({id,part,label});

// Cuerpo y aislamiento
for(let i=0;i<4;i++) add(`shell_jacket_${i}`, 'shell', `Panel de chaqueta ${i+1}`);
for(let i=0;i<4;i++) add(`shell_insulation_${i}`, 'shell', `Sector de aislamiento ${i+1}`);
for(let i=0;i<4;i++) add(`shell_pressure_${i}`, 'shell', `Sector de casco a presión ${i+1}`);
[-1.75,-.9,0,.9,1.75].forEach((_,i)=>add(`shell_hoop_${i}`,'shell',`Anillo exterior ${i+1}`));
add('shell_front_tubesheet','shell','Placa tubular frontal');
add('shell_rear_tubesheet','shell','Placa tubular posterior');
add('shell_manway','shell','Tapa de registro superior');

// Hogar
add('furnace_tube','furnace','Tubo de llama / hogar');
add('furnace_ring_front','furnace','Anillo frontal del hogar');
add('furnace_ring_rear','furnace','Anillo posterior del hogar');
add('furnace_refractory','furnace','Refractario frontal');

// Tubos
for(let i=0;i<45;i++) add(`tube_${String(i+1).padStart(2,'0')}`,'tubes',`Tubo de humo ${String(i+1).padStart(2,'0')}`);

// Quemador
['burner_body','burner_cone','burner_diffuser','burner_motor','burner_fan','burner_airbox','burner_fuel_pipe','burner_gas_train','burner_igniter'].forEach((id,i)=>add(id,'burner',['Cuerpo del quemador','Cono de llama','Difusor','Motor eléctrico','Ventilador','Caja de aire','Tubería de combustible','Tren de combustible','Encendedor'][i]));

// Cámaras de humos
['smokebox_front','smokebox_front_door','smokebox_rear','smokebox_rear_door','smokebox_stack_base','smokebox_stack','smokebox_cleanout'].forEach((id,i)=>add(id,'smokebox',['Cámara frontal de humos','Puerta frontal','Cámara posterior de humos','Puerta posterior','Base de chimenea','Chimenea','Registro de limpieza'][i]));

// Agua/vapor
['water_feed_pipe','water_feed_valve','water_feed_nozzle','steam_nozzle','steam_header','blowdown_pipe','blowdown_valve'].forEach((id,i)=>add(id,'watersteam',['Tubería de alimentación','Válvula de alimentación','Boquilla de alimentación','Boquilla de vapor','Colector de vapor','Tubería de purga','Válvula de purga'][i]));

// Válvulas e instrumentación
['safety_valve_1','safety_valve_2','pressure_gauge','gauge_siphon','level_glass','level_valve_top','level_valve_bottom','level_guard','pressure_switch'].forEach((id,i)=>add(id,'valves',['Válvula de seguridad 1','Válvula de seguridad 2','Manómetro','Sifón del manómetro','Visor de nivel','Válvula superior de nivel','Válvula inferior de nivel','Protector del visor','Presostato'][i]));

// Base
['base_rail_left','base_rail_right','base_cross_1','base_cross_2','base_saddle_front','base_saddle_rear','base_foot_1','base_foot_2','base_foot_3','base_foot_4'].forEach((id,i)=>add(id,'base',['Larguero izquierdo','Larguero derecho','Travesaño frontal','Travesaño posterior','Cuna frontal','Cuna posterior','Pie 1','Pie 2','Pie 3','Pie 4'][i]));

export const pieceCatalog = pieces;

export function describePiece(label:string):string {
 const direct:Record<string,string>={
  'Tubo de llama / hogar':'Conducto principal de combustión. Recibe la llama directamente y constituye una de las superficies de transferencia de calor más exigidas térmicamente.',
  'Placa tubular frontal':'Placa que fija y sella los extremos de los tubos de humo en el frente del recipiente.',
  'Placa tubular posterior':'Placa que soporta el extremo posterior del haz tubular y separa agua de la ruta de gases.',
  'Manómetro':'Instrumento que indica la presión interna del recipiente. En una instalación real debe seleccionarse y montarse de acuerdo con la normativa aplicable.',
  'Visor de nivel':'Indicador visual del nivel de agua. Permite verificar que las superficies de calefacción permanezcan correctamente cubiertas.',
  'Válvula de seguridad 1':'Dispositivo de alivio independiente destinado a limitar la presión máxima del recipiente.',
  'Válvula de seguridad 2':'Segundo dispositivo de alivio representado para mostrar redundancia de protección en calderas de vapor.',
  'Chimenea':'Conducto que evacua los productos de combustión después de atravesar las superficies de transferencia de calor.',
  'Motor eléctrico':'Acciona el ventilador que suministra aire de combustión al quemador.',
  'Ventilador':'Impulsa aire hacia el quemador para mantener la relación aire-combustible requerida.',
  'Tubería de purga':'Conduce agua y sólidos desde la parte inferior para purga y control de concentración.',
  'Colector de vapor':'Representa la salida superior desde la zona de vapor hacia la instalación usuaria.'
 };
 if(direct[label]) return direct[label];
 if(label.startsWith('Tubo de humo')) return 'Uno de los tubos que conduce gases calientes a través del agua. El conjunto aumenta notablemente el área de intercambio térmico.';
 if(label.startsWith('Panel de chaqueta')) return 'Panel exterior desmontable que protege el aislamiento y da terminación al cuerpo de la caldera.';
 if(label.startsWith('Sector de aislamiento')) return 'Capa térmica que disminuye pérdidas de calor desde el recipiente hacia el ambiente.';
 if(label.startsWith('Sector de casco')) return 'Segmento ilustrativo del recipiente a presión. En una caldera real el casco es una envolvente soldada continua y certificada.';
 if(label.startsWith('Anillo exterior')) return 'Aro exterior representado como elemento de terminación y rigidez de la chaqueta.';
 if(label.startsWith('Pie')) return 'Punto de apoyo de la bancada sobre la fundación.';
 return 'Pieza individual del modelo educativo. Su geometría y función se muestran con fines de comprensión del conjunto, no como plano de fabricación.';
}
