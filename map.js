// Variables globales pour le contrôle de la carte
let zoom;
let regions;
let cityGroups;
let width;
let height;

// Point d'intérêt central de la France
const FRANCE_CENTER = {
    longitude: 2.5,
    latitude: 46.7
};

// Configuration de la carte
function updateDimensions() {
    const franchisePanel = document.querySelector('.franchise-panel');
    const panelWidth = franchisePanel ? franchisePanel.offsetWidth : 350;
    
    // Dimensions minimales garanties
    const minWidth = 300;  // Largeur minimale de la carte
    const minHeight = 400; // Hauteur minimale de la carte
    
    // Calcul des dimensions en tenant compte des minimums
    const calculatedWidth = Math.max(window.innerWidth - panelWidth, minWidth);
    const calculatedHeight = Math.max(window.innerHeight, minHeight);
    
    return {
        width: calculatedWidth,
        height: calculatedHeight
    };
}

// Initialisation des dimensions
const dimensions = updateDimensions();
width = dimensions.width;
height = dimensions.height;

// Taille minimale de la carte
const MIN_SCALE = 2500;

// État initial de la carte
let initialState = {
    scale: MIN_SCALE,
    center: FRANCE_CENTER,
    translate: null
};

// Fonction pour calculer l'échelle optimale
function calculateOptimalScale(width, height) {
    // Dimensions minimales pour le calcul de l'échelle
    const minDimension = Math.min(width, height);
    
    // Réduction de l'échelle pour mobile (ratio hauteur/largeur > 1.5)
    if (height / width > 1.5) {
        const baseScale = Math.min(width * 2.0, height) * 3.2;
        return Math.max(MIN_SCALE, baseScale);
    }
    
    // Ajustement pour les différentes tailles d'écran
    let multiplier;
    if (width < 480) {
        multiplier = 4.0; // Très petits écrans
    } else if (width < 768) {
        multiplier = 3.7; // Petits écrans
    } else if (width < 992) {
        multiplier = 3.6; // Écrans moyens
    } else if (width < 1200) {
        multiplier = 3.6; // Grands écrans
    } else {
        multiplier = 3.7; // Très grands écrans
    }
    
    const baseScale = minDimension * multiplier;
    return Math.max(MIN_SCALE, baseScale);
}

// Fonction pour créer la projection avec état sauvegardé
function createProjection(width, height, preserveState = false) {
    const scale = preserveState && initialState.scale ? initialState.scale : calculateOptimalScale(width, height);
    
    const projection = d3.geoMercator()
        .center([FRANCE_CENTER.longitude, FRANCE_CENTER.latitude])
        .scale(scale)
        .translate([width / 2, height / 2]);

    // Sauvegarder l'état initial si c'est la première création
    if (!initialState.translate) {
        initialState.translate = [width / 2, height / 2];
    }

    return projection;
}

// Initialisation de la projection
let projection = createProjection(width, height);
let path = d3.geoPath().projection(projection);

// Création du zoom D3
const zoomBehavior = d3.zoom()
    .scaleExtent([1, 8])
    .filter(event => {
        // Autoriser uniquement la molette et les boutons de zoom, pas le drag
        return !event.button && event.type !== 'mousedown' && event.type !== 'mousemove';
    })
    .on('zoom', (event) => {
        // Vérifier que l'échelle ne descend pas en dessous du minimum
        const baseScale = calculateOptimalScale(width, height);
        const scale = Math.max(baseScale * event.transform.k, MIN_SCALE) / baseScale;
        
        const viewport = d3.select('#viewport');
        const currentTransform = viewport.attr('transform') || '';
        let translateX = 0;
        let translateY = 0;
        
        if (currentTransform.includes('translate')) {
            const matches = currentTransform.match(/translate\((.*?),(.*?)\)/);
            translateX = parseFloat(matches[1]);
            translateY = parseFloat(matches[2]);
        }
        
        viewport.attr('transform', `translate(${translateX},${translateY}) scale(${scale})`);
    });

// Création du SVG avec viewBox dynamique
const svg = d3.select("#map")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("preserveAspectRatio", "xMidYMid meet")
    .call(zoomBehavior);

// Ajout du pattern pour le logo
const defs = svg.append("defs");
const pattern = defs.append("pattern")
    .attr("id", "logo-pattern")
    .attr("width", 24)
    .attr("height", 24)
    .attr("patternUnits", "userSpaceOnUse");

pattern.append("image")
    .attr("href", "images/logo_sans_texte.png")
    .attr("width", 24)
    .attr("height", 24);

// Couleurs des régions
const regionColors = {
    "Auvergne-Rhône-Alpes": "#8B4C9C",
    "Bourgogne-Franche-Comté": "#2B5F9C",
    "Bretagne": "#C4B59D",
    "Centre-Val de Loire": "#FF8D3F",
    "Corse": "#6A2848",
    "Grand Est": "#4CADD3",
    "Hauts-de-France": "#B5D56A",
    "Île-de-France": "#7DCEF4",
    "Normandie": "#8FBE41",
    "Nouvelle-Aquitaine": "#FF5A5A",
    "Occitanie": "#E7467C",
    "Pays de la Loire": "#FFB951",
    "Provence-Alpes-Côte d'Azur": "#9C3766"
};

// Coordonnées des villes
const cities = [
    { name: "TOURS", coords: [0.6833, 47.3833] },
    { name: "LE MANS", coords: [0.2000, 48.0000] },
    { name: "RENNES", coords: [-1.6833, 48.0833] },
    { name: "NANTES", coords: [-1.5533, 47.2184] },
    { name: "ROUEN", coords: [1.0993, 49.4431] },
    { name: "BESANCON", coords: [6.0333, 47.2500] },
    { name: "CLERMONT-FERRAND", coords: [3.0819, 45.7772] },
    { name: "MONTPELLIER", coords: [3.8767, 43.6108] },
    { name: "MARSEILLE", coords: [5.3698, 43.2965] },
    { name: "PAU", coords: [-0.3667, 43.3000] },
    { name: "NIMES", coords: [4.3600, 43.8367] },
    { name: "BORDEAUX", coords: [-0.5800, 44.8378] },
    { name: "POITIERS", coords: [0.3333, 46.5833] },
    { name: "PARIS", coords: [2.3522, 48.8566] },
    { name: "LYON", coords: [4.8357, 45.7640] },
    { name: "TOULOUSE", coords: [1.4442, 43.6047] },
    { name: "LIMOGES", coords: [1.2611, 45.8336] },
    { name: "CANNES", coords: [7.0170, 43.5513] },
    { name: "VALENCE", coords: [4.8900, 44.9333] },
    { name: "STRASBOURG", coords: [7.7521, 48.5734] },
    { name: "REIMS", coords: [4.0347, 49.2583] },
    { name: "AMIENS", coords: [2.2950, 49.8941] },
    { name: "CAEN", coords: [-0.3590, 49.1826] },
    { name: "LILLE", coords: [3.0573, 50.6292] },
    { name: "BREST", coords: [-4.4833, 48.3900] },
    { name: "LA ROCHELLE", coords: [-1.1508, 46.1591] }
];

// Chargement de la carte
d3.json("https://raw.githubusercontent.com/gregoiredavid/france-geojson/master/regions.geojson")
    .then(function(france) {
        // Dessiner les régions
        regions = d3.select("#viewport")
            .selectAll("path")
            .data(france.features)
            .enter()
            .append("path")
            .attr("d", path)
            .attr("class", "region")
            .attr("fill", d => regionColors[d.properties.nom] || "#CCCCCC")
            .attr("stroke", "#FFFFFF")
            .attr("stroke-width", "1");

        // Ajouter les villes
        cityGroups = d3.select("#viewport")
            .selectAll("g")
            .data(cities)
            .enter()
            .append("g")
            .attr("class", "city")
            .attr("transform", d => `translate(${projection(d.coords)})`);

        // Ajouter les marqueurs
        cityGroups.append("circle")
            .attr("class", "city-marker")
            .attr("r", 4);

        // Ajouter les noms des villes
        cityGroups.append("text")
            .text(d => d.name);

        // Gestionnaires d'événements pour les boutons
        document.getElementById('zoom-in').onclick = () => {
            svg.transition()
                .duration(300)
                .call(zoomBehavior.scaleBy, 1.5);
        };

        document.getElementById('zoom-out').onclick = () => {
            svg.transition()
                .duration(300)
                .call(zoomBehavior.scaleBy, 0.75);
        };

        document.getElementById('reset').onclick = () => {
            svg.transition()
                .duration(300)
                .call(zoomBehavior.transform, d3.zoomIdentity);
        };
    });

// Gestion des raccourcis
const shortcutsToggle = document.getElementById('shortcuts-toggle');
const shortcuts = document.querySelector('.shortcuts');

shortcutsToggle.addEventListener('click', () => {
    shortcuts.classList.toggle('visible');
});

// Fermer les raccourcis en cliquant en dehors
document.addEventListener('click', (event) => {
    if (!shortcuts.contains(event.target) && !shortcutsToggle.contains(event.target)) {
        shortcuts.classList.remove('visible');
    }
}); 

// Fonction pour afficher la modale avec les informations du franchisé
function showFranchiseInfo(cityName) {
    const cleanCityName = cityName.replace('SEGUR', '').trim();
    const franchise = franchises.find(f => f.ville.toUpperCase() === cleanCityName);
    
    if (franchise) {
        // Mettre à jour le titre de la modale
        document.querySelector('.city-name').textContent = franchise.ville;
        
        // Créer les onglets
        const tabsContainer = document.querySelector('.franchise-tabs');
        tabsContainer.innerHTML = '';
        
        if (Array.isArray(franchise.equipe)) {
            franchise.equipe.forEach((membre, index) => {
                const tab = document.createElement('button');
                tab.className = `franchise-tab ${index === 0 ? 'active' : ''}`;
                
                const photoDiv = document.createElement('div');
                photoDiv.className = 'tab-photo';
                const img = document.createElement('img');
                img.src = membre.photo ? `images/franchises/${membre.photo}` : 'images/logo_sans_texte.png';
                img.onerror = () => { img.src = 'images/logo_sans_texte.png'; };
                photoDiv.appendChild(img);
                
                const infoDiv = document.createElement('div');
                infoDiv.className = 'tab-info';
                infoDiv.innerHTML = `
                    <div class="tab-name">${membre.prenom} ${membre.nom}</div>
                `;
                
                tab.appendChild(photoDiv);
                tab.appendChild(infoDiv);
                tab.onclick = () => updateFranchiseDetails(franchise, index);
                tabsContainer.appendChild(tab);
            });
            
            // Afficher les détails du premier membre
            updateFranchiseDetails(franchise, 0);
        } else {
            // Pour les franchises avec un seul membre
            const tab = document.createElement('button');
            tab.className = 'franchise-tab active';
            
            const photoDiv = document.createElement('div');
            photoDiv.className = 'tab-photo';
            const img = document.createElement('img');
            img.src = franchise.photo ? `images/franchises/${franchise.photo}` : 'images/logo_sans_texte.png';
            img.onerror = () => { img.src = 'images/logo_sans_texte.png'; };
            photoDiv.appendChild(img);
            
            const infoDiv = document.createElement('div');
            infoDiv.className = 'tab-info';
            infoDiv.innerHTML = `
                <div class="tab-name">${franchise.prenom} ${franchise.nom}</div>
            `;
            
            tab.appendChild(photoDiv);
            tab.appendChild(infoDiv);
            tabsContainer.appendChild(tab);
            
            // Mettre à jour les informations directement
            document.querySelector('.franchise-name').textContent = franchise.nom;
            document.querySelector('.franchise-firstname').textContent = franchise.prenom;
            document.querySelector('.franchise-email').textContent = franchise.email;
            document.querySelector('.franchise-phone').textContent = franchise.telephone;
            
            const photoElement = document.querySelector('.franchise-image');
            photoElement.src = franchise.photo ? `images/franchises/${franchise.photo}` : 'images/logo_sans_texte.png';
            photoElement.onerror = () => { photoElement.src = 'images/logo_sans_texte.png'; };
        }
        
        // Formater les départements
        const depsHtml = franchise.departements
            .map(dep => `<span>${dep}</span>`)
            .join('');
        document.querySelector('.franchise-departments').innerHTML = depsHtml;
        
        // Afficher la modale
        document.querySelector('.modal-overlay').classList.add('active');
        document.querySelector('.franchise-modal').classList.add('active');
    }
}

// Fonction pour mettre à jour les détails d'un membre
function updateFranchiseDetails(franchise, memberIndex) {
    const membre = franchise.equipe[memberIndex];
    
    // Mettre à jour les onglets actifs
    document.querySelectorAll('.franchise-tab').forEach((tab, index) => {
        tab.classList.toggle('active', index === memberIndex);
    });
    
    // Mettre à jour les informations
    document.querySelector('.franchise-name').textContent = membre.nom;
    document.querySelector('.franchise-firstname').textContent = membre.prenom;
    document.querySelector('.franchise-email').textContent = membre.email;
    document.querySelector('.franchise-phone').textContent = membre.telephone;
    
    // Formater les départements avec des spans
    const depsHtml = franchise.departements
        .map(dep => `<span>${dep}</span>`)
        .join('');
    document.querySelector('.franchise-departments').innerHTML = depsHtml;
}

// Fonction pour fermer la modale
function closeModal() {
    document.querySelector('.modal-overlay').classList.remove('active');
    document.querySelector('.franchise-modal').classList.remove('active');
}

// Ajouter les écouteurs d'événements pour la modale
document.addEventListener('DOMContentLoaded', () => {
    // Fermer la modale en cliquant sur le bouton de fermeture
    document.querySelector('.modal-close').addEventListener('click', closeModal);
    
    // Fermer la modale en cliquant sur l'overlay
    document.querySelector('.modal-overlay').addEventListener('click', closeModal);
});

// Modifier la fonction centerOnCity pour afficher la modale
function centerOnCity(cityName) {
    // Extraire le nom de la ville en enlevant "SEGUR "
    const cleanCityName = cityName.replace('SEGUR', '').trim();
    const city = cities.find(c => c.name === cleanCityName.toUpperCase());
    
    if (city) {
        // Réinitialiser tous les marqueurs
        d3.selectAll(".city-marker")
            .classed("selected", false)
            .attr("r", 4);
        
        // Sélectionner le marqueur de la ville
        const cityMarker = cityGroups
            .filter(d => d.name === cleanCityName.toUpperCase())
            .select(".city-marker");
            
        // Mettre en évidence le marqueur
        cityMarker.classed("selected", true)
                 .attr("r", 15);
            
        // Afficher les informations du franchisé
        showFranchiseInfo(cityName);
            
        // Réinitialiser le marqueur après 3 secondes
        setTimeout(() => {
            cityMarker.classed("selected", false)
                     .attr("r", 4);
        }, 3000);
    }
}

// Ajouter les écouteurs d'événements aux boutons "AFFICHER"
document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('.location-btn').forEach(button => {
        button.addEventListener('click', (e) => {
            const franchiseItem = e.target.closest('.franchise-item');
            const segurText = franchiseItem.querySelector('.segur').textContent;
            const villeText = franchiseItem.querySelector('.ville').textContent;
            const cityName = segurText + ' ' + villeText;
            centerOnCity(cityName);
        });
    });
}); 

// Gestion des touches flèches
document.addEventListener('keydown', (event) => {
    const MOVE_STEP = 50;
    const viewport = d3.select('#viewport');
    const currentTransform = viewport.attr('transform') || '';
    const currentScale = currentTransform.includes('scale') 
        ? parseFloat(currentTransform.match(/scale\((.*?)\)/)[1])
        : 1;
    
    let translateX = 0;
    let translateY = 0;
    
    if (currentTransform.includes('translate')) {
        const matches = currentTransform.match(/translate\((.*?),(.*?)\)/);
        translateX = parseFloat(matches[1]);
        translateY = parseFloat(matches[2]);
    }
    
    switch(event.key) {
        case 'ArrowLeft':
            translateX += MOVE_STEP;
            break;
        case 'ArrowRight':
            translateX -= MOVE_STEP;
            break;
        case 'ArrowUp':
            translateY += MOVE_STEP;
            break;
        case 'ArrowDown':
            translateY -= MOVE_STEP;
            break;
        default:
            return;
    }
    
    viewport.attr('transform', `translate(${translateX},${translateY}) scale(${currentScale})`);
    event.preventDefault();
});

// Ajout du déplacement avec le clic gauche
let isDragging = false;
let startX, startY, startTranslateX, startTranslateY;

// Fonction pour obtenir la transformation actuelle
function getCurrentTransform() {
    const viewport = d3.select('#viewport');
    const currentTransform = viewport.attr('transform') || '';
    let translateX = 0;
    let translateY = 0;
    let scale = 1;
    
    if (currentTransform.includes('translate')) {
        const matches = currentTransform.match(/translate\((.*?),(.*?)\)/);
        translateX = parseFloat(matches[1]) || 0;
        translateY = parseFloat(matches[2]) || 0;
    }
    
    if (currentTransform.includes('scale')) {
        const scaleMatch = currentTransform.match(/scale\((.*?)\)/);
        scale = parseFloat(scaleMatch[1]) || 1;
    }
    
    return { translateX, translateY, scale };
}

// Gestionnaire de début de drag
svg.on('mousedown.drag', (event) => {
    if (event.button === 0) { // Clic gauche uniquement
        event.preventDefault();
        event.stopPropagation();
        isDragging = true;
        
        const { translateX, translateY } = getCurrentTransform();
        startX = event.clientX;
        startY = event.clientY;
        startTranslateX = translateX;
        startTranslateY = translateY;
        
        // Ajouter une classe pendant le drag
        d3.select('#viewport').classed('dragging', true);
    }
});

// Gestionnaire de mouvement
svg.on('mousemove.drag', (event) => {
    if (isDragging) {
        event.preventDefault();
        event.stopPropagation();
        
        const dx = event.clientX - startX;
        const dy = event.clientY - startY;
        const { scale } = getCurrentTransform();
        
        d3.select('#viewport')
            .attr('transform', `translate(${startTranslateX + dx},${startTranslateY + dy}) scale(${scale})`);
    }
});

// Gestionnaire de fin de drag
function endDrag() {
    if (isDragging) {
        isDragging = false;
        d3.select('#viewport').classed('dragging', false);
    }
}

svg.on('mouseup.drag', endDrag);
svg.on('mouseleave.drag', endDrag);

// Désactiver la sélection de texte pendant le drag
svg.style('user-select', 'none')
   .style('-webkit-user-select', 'none')
   .style('-moz-user-select', 'none')
   .style('-ms-user-select', 'none');

// Ajout des écouteurs d'événements pour le tactile
const mapContainer = document.querySelector('.map-container');
mapContainer.addEventListener('touchstart', () => {}, { passive: true });
mapContainer.addEventListener('touchmove', () => {}, { passive: true });
mapContainer.addEventListener('wheel', () => {}, { passive: true }); 

// Gestion du redimensionnement
window.addEventListener('resize', () => {
    // Mettre à jour les dimensions
    const dimensions = updateDimensions();
    width = dimensions.width;
    height = dimensions.height;
    
    // Mettre à jour le SVG
    svg.attr("width", width)
       .attr("height", height)
       .attr("viewBox", `0 0 ${width} ${height}`);
    
    // Recréer la projection
    projection = createProjection(width, height);
    path = d3.geoPath().projection(projection);
    
    // Mettre à jour les éléments de la carte
    if (regions && cityGroups) {
        regions.attr("d", path);
        cityGroups.attr("transform", d => `translate(${projection(d.coords)})`);
        
        // Recentrer la vue
        svg.transition()
           .duration(300)
           .call(zoomBehavior.transform, d3.zoomIdentity);
    }
}); 