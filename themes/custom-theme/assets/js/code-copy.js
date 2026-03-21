document.addEventListener('DOMContentLoaded', () => {
    const codeBlocks = document.querySelectorAll('.highlight');

    codeBlocks.forEach((block) => {
        const codeElement = block.querySelector('code');
        if (!codeElement) {
            return;
        }

        if (block.querySelector('.copy-code-btn')) {
            return;
        }

        const button = document.createElement('button');
        button.className = 'copy-code-btn';
        button.type = 'button';
        button.setAttribute('aria-label', 'Copy code');
        button.textContent = 'Copy';

        button.addEventListener('click', async () => {
            const codeText = codeElement.innerText;
            try {
                await navigator.clipboard.writeText(codeText);
                button.textContent = 'Copied';
                button.classList.add('copied');
                setTimeout(() => {
                    button.textContent = 'Copy';
                    button.classList.remove('copied');
                }, 1400);
            } catch (error) {
                button.textContent = 'Failed';
                setTimeout(() => {
                    button.textContent = 'Copy';
                }, 1400);
            }
        });

        block.appendChild(button);
    });
});
