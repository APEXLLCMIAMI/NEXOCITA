const test = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const source=fs.readFileSync(require('node:path').join(__dirname,'../supabase-db.js'),'utf8');
function setup(client){const context={window:{NEXOCITA_SUPABASE_CONFIG:{url:'https://example.com',anonKey:'public'},supabase:{createClient:()=>client}}};vm.runInNewContext(source,context);return context.window.CloudDB;}
test('un rechazo del servidor nunca confirma la reserva',async()=>{
 const db=setup({rpc:async()=>({error:{message:'Horario ocupado'}})});
 await assert.rejects(db.saveAppointment({id:'test'},'token'),/Horario ocupado/);
});
test('la reserva usa la respuesta persistida del servidor',async()=>{
 const db=setup({rpc:async()=>({data:{id:'NC-test',service_name:'Servicio real',status:'confirmed'}})});
 const app={id:'NC-test',service_name:'valor del navegador'};
 assert.equal(await db.saveAppointment(app,'token'),true);assert.equal(app.service_name,'Servicio real');
});
test('sin sesión no se consulta la tabla de clientes',async()=>{
 let queried=false;const db=setup({auth:{getSession:async()=>({data:{session:null}})},from:()=>{queried=true;}});
 await assert.rejects(db.getAppointments(),/Inicia sesión/);assert.equal(queried,false);
});
test('consultar y cancelar exige id y clave al servidor',async()=>{
 const calls=[];const db=setup({rpc:async(name,args)=>{calls.push({name,args});return {data:true};}});
 await db.lookupAppointment('NC-test','private');await db.cancelAppointment('NC-test','private');
 assert.equal(calls[0].name,'nexocita_lookup');assert.equal(calls[1].args.p_token,'private');
});
