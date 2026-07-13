let supabaseClient;
let allOrders = [];
const $ = id => document.getElementById(id);
function show(el,v=true){el.classList.toggle("hidden",!v)}
function showLoginMessage(t){const e=$("orders-login-message");e.textContent=t;show(e,true)}
function showMessage(t,err=false){const e=$("orders-message");e.textContent=t;show(e,true);e.style.borderColor=err?"#7d2525":"#0B3D2E"}
function money(v){return `${Number(v||0).toFixed(2)} NOK`}
function date(v){return v?new Intl.DateTimeFormat("nb-NO",{dateStyle:"medium",timeStyle:"short"}).format(new Date(v)):""}
function label(s){return({pending:"Venter",processing:"Behandles",completed:"Fullført",cancelled:"Kansellert"}[s]||s||"Venter")}
async function loadConfig(){
  const c=await fetch("/api/config").then(r=>r.json());
  if(!c.supabaseUrl||!c.supabaseKey) throw new Error("Supabase-konfigurasjon mangler.");
  supabaseClient=window.supabase.createClient(c.supabaseUrl,c.supabaseKey);
}
async function checkSession(){
  const {data:{session}}=await supabaseClient.auth.getSession();
  if(!session){show($("orders-login-panel"),true);show($("orders-panel"),false);return}
  $("orders-admin-email").textContent=session.user.email;
  show($("orders-login-panel"),false);show($("orders-panel"),true);
  await loadOrders();
}
async function loadOrders(){
  $("orders-list").innerHTML="<p>Laster bestillinger...</p>";
  const {data,error}=await supabaseClient.from("orders").select("*, order_items(id,product_id,quantity,price,products(name,sku))").order("created_at",{ascending:false});
  if(error){$("orders-list").innerHTML="";showMessage(error.message,true);return}
  allOrders=data||[];renderStats();renderOrders();
}
function renderStats(){
  $("stat-total-orders").textContent=allOrders.length;
  $("stat-pending-orders").textContent=allOrders.filter(o=>o.status==="pending").length;
  $("stat-completed-orders").textContent=allOrders.filter(o=>o.status==="completed").length;
  $("stat-revenue").textContent=money(allOrders.filter(o=>o.status!=="cancelled").reduce((s,o)=>s+Number(o.total||0),0));
}
function getFiltered(){
  const q=$("orders-search").value.trim().toLowerCase(), s=$("orders-status-filter").value;
  return allOrders.filter(o=>{
    const h=[o.id,o.customer_name,o.customer_email,o.customer_phone,o.city,o.postal_code].join(" ").toLowerCase();
    return (!q||h.includes(q))&&(!s||o.status===s);
  });
}
function renderOrders(){
  const list=getFiltered(), el=$("orders-list");
  if(!list.length){el.innerHTML="<p>Ingen bestillinger funnet.</p>";return}
  el.innerHTML=list.map(o=>{
    const rows=(o.order_items||[]).map(i=>`<tr><td>${i.products?.name||"Produkt"}${i.products?.sku?`<br><span class="muted">SKU: ${i.products.sku}</span>`:""}</td><td>${Number(i.quantity||0)}</td><td>${money(i.price)}</td><td>${money(Number(i.price||0)*Number(i.quantity||0))}</td></tr>`).join("")||`<tr><td colspan="4">Ingen ordrelinjer.</td></tr>`;
    return `<article class="order-card">
      <div class="order-card-top"><div><span class="status-badge status-${o.status||"pending"}">${label(o.status)}</span><h2>Ordre ${String(o.id).slice(0,8)}</h2><p class="muted">${date(o.created_at)}</p></div><div class="order-total"><span>Total</span><strong>${money(o.total)}</strong></div></div>
      <div class="order-grid">
        <section><h3>Kunde</h3><p><strong>${o.customer_name||""}</strong></p><p>${o.customer_email||""}</p><p>${o.customer_phone||""}</p></section>
        <section><h3>Levering</h3><p>${o.shipping_address||""}</p><p>${o.postal_code||""} ${o.city||""}</p></section>
        <section><h3>Status</h3><select class="order-status-select" onchange="updateOrderStatus('${o.id}',this.value)">
          <option value="pending" ${o.status==="pending"?"selected":""}>Venter</option>
          <option value="processing" ${o.status==="processing"?"selected":""}>Behandles</option>
          <option value="completed" ${o.status==="completed"?"selected":""}>Fullført</option>
          <option value="cancelled" ${o.status==="cancelled"?"selected":""}>Kansellert</option>
        </select></section>
      </div>
      <div class="table-wrap"><table class="table"><thead><tr><th>Produkt</th><th>Antall</th><th>Pris</th><th>Sum</th></tr></thead><tbody>${rows}</tbody></table></div>
    </article>`;
  }).join("");
}
window.updateOrderStatus=async function(id,status){
  const {error}=await supabaseClient.from("orders").update({status}).eq("id",id);
  if(error){showMessage(error.message,true);return}
  const o=allOrders.find(x=>x.id===id);if(o)o.status=status;renderStats();renderOrders();showMessage("Ordrestatus oppdatert.");
}
$("orders-login-form").addEventListener("submit",async e=>{
  e.preventDefault();$("orders-login-message").classList.add("hidden");
  const {error}=await supabaseClient.auth.signInWithPassword({email:$("orders-login-email").value.trim(),password:$("orders-login-password").value});
  if(error){showLoginMessage(error.message);return} await checkSession();
});
$("orders-logout-btn").addEventListener("click",async()=>{await supabaseClient.auth.signOut();await checkSession()});
$("orders-search").addEventListener("input",renderOrders);
$("orders-status-filter").addEventListener("change",renderOrders);
$("refresh-orders").addEventListener("click",loadOrders);
(async()=>{try{await loadConfig();await checkSession()}catch(e){showLoginMessage(e.message)}})();