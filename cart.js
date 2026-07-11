function cart(){return JSON.parse(localStorage.getItem("tb_cart")||"[]")}
const items=cart();
const wrap=document.getElementById("cart-items");
wrap.innerHTML=items.length?items.map(p=>`<div class="cart-row"><span>${p.name}</span><strong>${Number(p.price)>0?p.price+" NOK":"Pris settes senere"}</strong></div>`).join(""):"<p>Kurven er tom.</p>";
const total=items.reduce((s,p)=>s+(Number(p.price)||0),0);
document.getElementById("cart-total").textContent=`Total: ${total} NOK`;
