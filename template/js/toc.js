(function () {
  class TableOfContents {
    constructor() {
      this.tocContainer = document.getElementById('toc-container');
      this.markdownBody = document.querySelector('.markdown-body');
      this.init();
    }

    init() {
      if (!this.tocContainer || !this.markdownBody) return;
      
      const headings = this.extractHeadings();
      if (headings.length === 0) {
        this.tocContainer.style.display = 'none';
        return;
      }
      
      const tocHTML = this.generateTocHTML(headings);
      this.tocContainer.innerHTML = tocHTML;
      this.bindEvents();
      this.highlightCurrentSection();
      
      window.addEventListener('scroll', () => this.highlightCurrentSection());
    }

    extractHeadings() {
      const headings = [];
      const headingTags = this.markdownBody.querySelectorAll('h1, h2, h3');
      
      headingTags.forEach((heading, index) => {
        const level = parseInt(heading.tagName.charAt(1));
        const id = heading.id || `heading-${index}`;
        if (!heading.id) {
          heading.id = id;
        }
        
        headings.push({
          id,
          text: heading.textContent.trim(),
          level
        });
      });
      
      return headings;
    }

    generateTocHTML(headings) {
      let html = '<ul class="toc-list">';
      let currentLevel = 1;
      
      headings.forEach((heading) => {
        while (heading.level > currentLevel) {
          html += '<ul class="toc-list">';
          currentLevel++;
        }
        
        while (heading.level < currentLevel) {
          html += '</ul></li>';
          currentLevel--;
        }
        
        html += `<li class="toc-item"><a href="#${heading.id}" class="toc-link">${heading.text}</a>`;
      });
      
      while (currentLevel >= 1) {
        html += '</li></ul>';
        currentLevel--;
      }
      
      return html;
    }

    bindEvents() {
      const links = this.tocContainer.querySelectorAll('.toc-link');
      
      links.forEach(link => {
        link.addEventListener('click', (e) => {
          e.preventDefault();
          const targetId = link.getAttribute('href').substring(1);
          const targetElement = document.getElementById(targetId);
          
          if (targetElement) {
            const offsetTop = targetElement.offsetTop - 80;
            window.scrollTo({
              top: offsetTop,
              behavior: 'smooth'
            });
          }
        });
      });
    }

    highlightCurrentSection() {
      const scrollPosition = window.scrollY + 100;
      const headings = this.markdownBody.querySelectorAll('h1, h2, h3');
      const links = this.tocContainer.querySelectorAll('.toc-link');
      
      let currentHeadingId = '';
      
      headings.forEach((heading) => {
        const headingTop = heading.offsetTop;
        if (scrollPosition >= headingTop) {
          currentHeadingId = heading.id;
        }
      });
      
      links.forEach(link => {
        link.classList.remove('active');
        if (link.getAttribute('href') === `#${currentHeadingId}`) {
          link.classList.add('active');
        }
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => new TableOfContents());
  } else {
    new TableOfContents();
  }
})();