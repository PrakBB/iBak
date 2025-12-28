
const styles: Record<string, string> = {
    'Styl 1 (Dunder Mifflin)': 'style1.css',
    'Styl 2 (Neon Night)': 'style2.css',
    'Styl 3 (Brak - test)': 'style3.css'
};

let currentLinkElement: HTMLLinkElement | null = null;

function changeStyle(styleFileName: string): void {
    if (currentLinkElement) {
        currentLinkElement.remove();
    }

    const newLink = document.createElement('link');
    newLink.rel = 'stylesheet';
    newLink.href = styleFileName;

    document.head.appendChild(newLink);
    currentLinkElement = newLink;
}


function generateStyleLinks(): void {
    const footer = document.querySelector('footer');

    if (!footer) return;

    const container = document.createElement('div');
    container.id = 'style-switcher';
    container.style.marginTop = '15px';
    container.style.paddingTop = '10px';
    container.style.borderTop = '1px solid rgba(0,0,0,0.1)';
    container.style.display = 'flex';
    container.style.justifyContent = 'center';
    container.style.gap = '20px';
    container.style.flexWrap = 'wrap';
    container.style.fontSize = '0.9em';

    const label = document.createElement('span');
    label.innerText = 'Wybierz styl: ';
    label.style.opacity = '0.7';
    container.appendChild(label);


    for (const [styleName, fileName] of Object.entries(styles)) {
        const link = document.createElement('a');
        link.innerText = styleName;
        link.href = '#';


        link.style.textDecoration = 'none';
        link.style.fontWeight = 'bold';
        link.style.cursor = 'pointer';
        link.style.color = 'inherit';
        link.style.borderBottom = '1px dashed currentColor';

        link.addEventListener('click', (e) => {
            e.preventDefault();
            changeStyle(fileName);
        });

        container.appendChild(link);
    }

    footer.appendChild(container);
}


const defaultStyle = Object.values(styles)[0];
changeStyle(defaultStyle);
generateStyleLinks();