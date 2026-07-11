const SEED_PRODUCTS=[{"id": "514001", "name": "Smoking Gold King Size Slim 50 stk", "brand": "Smoking", "category": "Rullepapir", "price": 0, "stock": 0, "tag": "SM", "description": "King Size Slim rullepapir i displaypakke. Et ryddig premiumvalg for butikkens papirsortiment."}, {"id": "514002", "name": "Smoking Blue King Size Regular 50 stk", "brand": "Smoking", "category": "Rullepapir", "price": 0, "stock": 0, "tag": "SM", "description": "King Size Regular rullepapir med klassisk profil og praktisk displaypakning."}, {"id": "514960", "name": "Greengo Unbleached King Size Slim 50 stk", "brand": "Greengo", "category": "Rullepapir", "price": 0, "stock": 0, "tag": "GG", "description": "Ubleket King Size Slim papir fra Greengo i displaypakke."}];
const CATEGORIES=["Snus","Sigaretter","Sigarer","Cigarillos","Rulletobakk","Rullepapir","Pipetobakk","Tilbehør","Hemp Wraps"];
function products(){return JSON.parse(localStorage.getItem("tb_products")||JSON.stringify(SEED_PRODUCTS))}
function cart(){return JSON.parse(localStorage.getItem("tb_cart")||"[]")}
function saveCart(value){localStorage.setItem("tb_cart",JSON.stringify(value));updateCartCount()}
function updateCartCount(){const el=document.getElementById("cart-count");if(el)el.textContent=cart().length}
function addToCart(id){const p=products().find(x=>String(x.id)===String(id));if(!p)return;const c=cart();c.push(p);saveCart(c);alert("Lagt i kurv")}
function productCard(p){return `<article class="product-card"><div class="product-image">${p.tag||"TB"}</div><h3>${p.name}</h3><p class="muted">${p.brand||""} • ${p.category}</p><p>${p.description||""}</p><p class="price">${Number(p.price)>0?p.price+" NOK":"Pris settes senere"}</p><button class="btn" onclick="addToCart('${p.id}')">Legg i kurv</button></article>`}
const categoryGrid=document.getElementById("category-grid");
categoryGrid.innerHTML=CATEGORIES.map(c=>`<a class="category-card" href="#products" data-category="${c}">${c}</a>`).join("");
const grid=document.getElementById("product-grid");
function render(list){grid.innerHTML=list.length?list.map(productCard).join(""):"<p>Ingen produkter funnet.</p>"}
render(products());
document.getElementById("search").addEventListener("input",e=>{const q=e.target.value.toLowerCase();render(products().filter(p=>(p.name+" "+p.brand+" "+p.category).toLowerCase().includes(q)))})
document.querySelectorAll("[data-category]").forEach(el=>el.addEventListener("click",()=>render(products().filter(p=>p.category===el.dataset.category))));
updateCartCount();
