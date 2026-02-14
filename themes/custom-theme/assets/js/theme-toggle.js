(function () {
    // Check for saved theme preference, otherwise use system preference
    const getPreferredTheme = () => {
        const storedTheme = localStorage.getItem('theme');
        if (storedTheme) {
            return storedTheme;
        }
        return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    };

    const setTheme = (theme) => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    };

    // Initialize theme immediately
    const initialTheme = getPreferredTheme();
    setTheme(initialTheme);

    // Event listener for toggle button
    // Using event delegation or waiting for DOMContentLoaded
    const initToggle = () => {
        const toggleBtn = document.getElementById('theme-toggle');
        if (toggleBtn) {
            // Remove existing listeners to avoid duplicates if re-run
            const newBtn = toggleBtn.cloneNode(true);
            toggleBtn.parentNode.replaceChild(newBtn, toggleBtn);

            newBtn.addEventListener('click', () => {
                const currentTheme = document.documentElement.getAttribute('data-theme');
                const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
                setTheme(newTheme);
            });
        } else {
            // If button not found, retry in a moment (fallback)
            setTimeout(initToggle, 100);
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initToggle);
    } else {
        initToggle();
    }
})();
