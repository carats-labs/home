window.onload = () => {
    document.querySelectorAll('nav a').forEach(a => {
        if(a.href === location.href){
            a.setAttribute('aria-current', 'page');
            expandAllParentLists(a);
        }
    });

    /**
     * @param {HTMLElement} node 
     */
    function expandAllParentLists(node){
        if (node == undefined) return;
        if (node.tagName === 'LI' && node.role === "group"){
            node.setAttribute('aria-expanded', 'true');
            node.querySelector('.expand-button').setAttribute('aria-expanded', 'true');
        }
        return expandAllParentLists(node.parentElement);
    }
}
(function () {
    function getElements() {
        return {
            layout: document.getElementById('layout'),
            menu: document.getElementById('menu'),
            menuLink: document.getElementById('menuLink'),
            searchResultContainer: document.getElementById('search-result-container'),
            versionOptions: document.getElementById('version-options')
        };
    }
    const elements = getElements();

    function toggleActiveState() {
        const isActive = elements.layout.dataset.active === 'true';
        elements.layout.dataset.active = !isActive;
        elements.menu.dataset.active = !isActive;
        elements.menuLink.dataset.active = !isActive;
    }

    /**
     * @param {MouseEvent} e
     */
    function handleEvent(e) {
        const clickAllowedElements = [elements.menu].filter(e => !!e);
        const isInAllowedElement = clickAllowedElements.some(allowedElement => allowedElement.contains(e.target));
        if (e.target.id === elements.menuLink.id) {
            toggleActiveState();
            e.preventDefault();
        } else if (!isInAllowedElement && elements.menu.dataset.active === 'true') {
            toggleActiveState();
        }

        if(e.target.id !== 'search-bar' && !elements.searchResultContainer.contains(e.target)){
            elements.searchResultContainer.dataset.hide = 'true';
        }
    }
    document.addEventListener('click', handleEvent);
    const searchBar = document.getElementById("search-bar");
    searchBar.addEventListener("focus", () => {
        getElements().searchResultContainer.dataset.hide = 'false';
    });
    searchBar.addEventListener("blur", (e) => {
        if(e.relatedTarget.id !== 'search-bar' && !elements.searchResultContainer.contains(e.relatedTarget)){
            elements.searchResultContainer.dataset.hide = 'true';
        }
    });
    
    const expandButtons = document.querySelectorAll('.expand-button');
    expandButtons.forEach(button => {
        button.addEventListener('click', function(){
            const parentList = this.parentElement.parentElement;
            const isExpanded = parentList.getAttribute('aria-expanded') === 'true';
            parentList.setAttribute('aria-expanded', !isExpanded);
            button.setAttribute('aria-expanded', !isExpanded);
        });
    });
}());
