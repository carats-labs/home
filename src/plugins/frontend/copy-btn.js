window.addEventListener('DOMContentLoaded', () => {
    const copyBtns = document.querySelectorAll('.copy-btn');
    copyBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const text = btn.getAttribute('data-copy');
            const copyLabel = btn.getAttribute('data-copy-label')
            const copiedLabel = btn.getAttribute('data-copied-label')
            navigator.clipboard.writeText(text);
            btn.textContent = copiedLabel;
            setTimeout(() => {
                btn.textContent = copyLabel;
            }, 2000);
        })
    });
});