/**
 * ADON CMS Loader — site.json'dan blok görünürlüğü ve sırası yönetimi
 * Her sayfaya include edilir, PAGE_KEY değişkeni o sayfada tanımlanır.
 */
(function(){
  if(typeof PAGE_KEY === 'undefined') return;

  fetch('site.json?v='+Date.now())
    .then(function(r){ return r.json(); })
    .then(function(site){
      var pageData = site[PAGE_KEY] || {};
      var blocks = pageData._blocks || [];

      if(!blocks.length) return;

      // Referans container — blokları taşıyacağımız ebeveyn
      // İlk bloğun parentElement'ini bul
      var firstBlock = document.getElementById(blocks[0].id);
      if(!firstBlock) return;
      var parent = firstBlock.parentElement;

      // Önce tüm blokları sırala (DOM'dan çıkar, sıraya göre geri ekle)
      var fragment = document.createDocumentFragment();
      blocks.forEach(function(block){
        var el = document.getElementById(block.id);
        if(!el) return;

        // Görünürlük
        if(block.visible === false){
          el.style.display = 'none';
        } else {
          el.style.display = '';
        }

        fragment.appendChild(el);
      });

      // Yeni sırayla parent'a ekle
      // Önce parent'taki diğer (blok olmayan) elemanları bul
      var nonBlockChildren = [];
      Array.from(parent.children).forEach(function(child){
        if(!child.dataset.cmsBlock){
          nonBlockChildren.push({el: child, nextSibling: child.nextSibling});
        }
      });

      parent.appendChild(fragment);
    })
    .catch(function(){});
})();
