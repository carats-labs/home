import instajax from 'instajax';
instajax({
    errorHTML: `url("${window.getLink({ slug: 'error' })}")`
})