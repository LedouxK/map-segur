// Variables globales pour le contrôle de la carte
let zoom;
let cityGroups;
let width;
let height;
let departements;
let projection;
let path;
let viewport;
let isDragging = false;
let startX, startY, startTranslateX, startTranslateY;
let selectedCity = null; // Variable pour stocker la ville sélectionnée
let svg = null;

// Test simple au début du fichier, après les variables globales
console.log("=== TEST CHARGEMENT DEPARTEMENTS ===");

fetch('data/departements.json')
    .then(response => {
        console.log("Status de la réponse:", response.status);
        console.log("OK?", response.ok);
        return response.json();
    })
    .then(data => {
        console.log("Données chargées:", data);
        console.log("Type:", typeof data);
        if (data.features) {
            console.log("Nombre de départements:", data.features.length);
            console.log("Premier département:", data.features[0]);
        }
    })
    .catch(error => {
        console.error("Erreur lors du chargement:", error);
    });

// Fonction pour obtenir les coordonnées d'une ville
function getCityCoordinates(cityName) {
    const cityCoords = {
        "TOURS": [0.6833, 47.3833],
        "LE MANS": [0.2000, 48.0000],
        "RENNES": [-1.6833, 48.0833],
        "NANTES": [-1.5533, 47.2184],
        "ROUEN": [1.0993, 49.4431],
        "BESANÇON": [6.0333, 47.2500],
        "CLERMONT-FERRAND": [3.0819, 45.7772],
        "MONTPELLIER": [3.8767, 43.6108],
        "MARSEILLE": [5.3698, 43.2965],
        "PAU": [-0.3667, 43.3000],
        "NIMES": [4.3600, 43.8367],
        "BORDEAUX": [-0.5800, 44.8378],
        "POITIERS": [0.3333, 46.5833],
        "LA ROCHELLE": [-1.1508, 46.1591]
    };
    return cityCoords[cityName] || [0, 0];
}

// Point d'intérêt central de la France
const FRANCE_CENTER = {
    longitude: 2.5,
    latitude: 46.7
};

// Configuration de la carte
function updateDimensions() {
    const container = document.querySelector('.map-container');
    if (!container) return { width: 800, height: 600 };
    
    const width = container.clientWidth;
    const height = container.clientHeight;
    
    return { width, height };
}

// Initialisation des dimensions
const dimensions = updateDimensions();
width = dimensions.width;
height = dimensions.height;

// Fonction pour calculer l'échelle optimale
function calculateOptimalScale(width, height) {
    return Math.min(width, height) * 3.5;
}

// Initialisation du SVG au chargement de la page
document.addEventListener('DOMContentLoaded', () => {
    // Initialisation du SVG
    svg = d3.select("#map")
        .attr("width", width)
        .attr("height", height);

    viewport = svg.select("#viewport");
    
    // Configuration du zoom
    zoom = d3.zoom()
        .scaleExtent([1, 8])
        .on('zoom', (event) => {
            viewport.attr('transform', event.transform);
        });

    svg.call(zoom);

    // Initialisation de la carte
    initializeMap();
});

// Fonction d'initialisation de la carte
async function initializeMap() {
    try {
        // 1. Charger les données
        console.log("Chargement des données...");
        const [franceData, departementsData] = await Promise.all([
            fetch('data/fra2021.json').then(r => r.json()),
            fetch('data/departements.json').then(r => r.json())
        ]);
        console.log("Données chargées avec succès");

        // 2. Configurer la projection
        projection = d3.geoMercator()
            .center([2.5, 46.7])
            .scale(calculateOptimalScale(width, height))
            .translate([width / 2, height / 2]);

        // 3. Créer le générateur de chemin
        path = d3.geoPath().projection(projection);

        // 4. Dessiner les départements
        console.log("Dessin des départements...");
        const departementsGroup = viewport.append("g")
            .attr("class", "departements");

        departementsGroup.selectAll("path")
            .data(departementsData.features)
            .enter()
            .append("path")
            .attr("class", d => `departement dep-${d.properties.code}`)
            .attr("d", path)
            .attr("fill", "white")
            .attr("stroke", "#CCCCCC")
            .attr("stroke-width", "0.5")
            .on("mouseover", function(event, d) {
                const franchise = franchises.find(f => f.departements.includes(d.properties.code));
                if (franchise && (!selectedCity || selectedCity === franchise.ville)) {
                    highlightDepartements(franchise.ville, true);
                }
            })
            .on("mouseout", function(event, d) {
                const franchise = franchises.find(f => f.departements.includes(d.properties.code));
                if (franchise && !selectedCity) {
                    highlightDepartements(franchise.ville, false);
                }
            })
            .on("click", function(event, d) {
                event.stopPropagation();
                const franchise = franchises.find(f => f.departements.includes(d.properties.code));
                if (franchise) {
                    selectCity(franchise.ville);
                    showFranchiseInfo(franchise.ville);
                    centerOnCity(franchise.ville);
                }
            });

        // 5. Dessiner la France (contour uniquement pour les départements non-français)
        console.log("Dessin de la France...");
        viewport.append("path")
            .datum(franceData)
            .attr("d", path)
            .attr("fill", "none")
            .attr("stroke", "#CCCCCC")
            .attr("stroke-width", "0.5")
            .attr("class", "france-border");

        // 6. Ajouter les villes
        console.log("Ajout des villes...");
        cityGroups = viewport.selectAll("g.city")
            .data(cities)
            .enter()
            .append("g")
            .attr("class", "city")
            .attr("transform", d => `translate(${projection(d.coords)})`)
            .on("mouseover", function(event, d) {
                if (!selectedCity) {
                    console.log("Survol de la ville:", d.name);
                    highlightDepartements(d.name, true);
                }
            })
            .on("mouseout", function(event, d) {
                if (!selectedCity) {
                    highlightDepartements(d.name, false);
                }
            })
            .on("click", function(event, d) {
                event.stopPropagation();
                selectCity(d.name);
                showFranchiseInfo(d.name);
                centerOnCity(d.name);
            });

        // Ajouter les cercles pour les villes
        cityGroups.append("circle")
            .attr("class", "city-marker")
            .attr("r", 4);

        // Ajouter les noms des villes
        cityGroups.append("text")
            .attr("x", 8)
            .attr("y", 4)
            .text(d => d.name);

        // Ajouter l'écouteur d'événement pour le clic sur la carte
        d3.select("#map").on("click", handleMapClick);

        console.log("Initialisation terminée");

    } catch (error) {
        console.error("Erreur lors de l'initialisation:", error);
    }
}

// Coordonnées des villes
const cities = [
    { name: "TOURS", coords: [0.6833, 47.3833] },
    { name: "LE MANS", coords: [0.2000, 48.0000] },
    { name: "RENNES", coords: [-1.6833, 48.0833] },
    { name: "NANTES", coords: [-1.5533, 47.2184] },
    { name: "ROUEN", coords: [1.0993, 49.4431] },
    { name: "BESANÇON", coords: [6.0333, 47.2500] },
    { name: "CLERMONT-FERRAND", coords: [3.0819, 45.7772] },
    { name: "MONTPELLIER", coords: [3.8767, 43.6108] },
    { name: "MARSEILLE", coords: [5.3698, 43.2965] },
    { name: "PAU", coords: [-0.3667, 43.3000] },
    { name: "NIMES", coords: [4.3600, 43.8367] },
    { name: "BORDEAUX", coords: [-0.5800, 44.8378] },
    { name: "POITIERS", coords: [0.3333, 46.5833] },
    { name: "LA ROCHELLE", coords: [-1.1508, 46.1591] }
];

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

// Fonction d'initialisation de la carte
async function initializeMap() {
    try {
        // 1. Charger les données
        console.log("Chargement des données...");
        const [franceData, departementsData] = await Promise.all([
            fetch('data/fra2021.json').then(r => r.json()),
            fetch('data/departements.json').then(r => r.json())
        ]);
        console.log("Données chargées avec succès");

        // 2. Initialiser la projection
        projection = d3.geoMercator()
            .center([FRANCE_CENTER.longitude, FRANCE_CENTER.latitude])
            .scale(calculateOptimalScale(width, height))
            .translate([width / 2, height / 2]);

        path = d3.geoPath().projection(projection);

        // 3. Créer le viewport
        viewport = d3.select("#viewport");

        // 4. Dessiner les départements
        console.log("Dessin des départements...");
        const departementsGroup = viewport.append("g")
            .attr("class", "departements");

        departementsGroup.selectAll("path")
            .data(departementsData.features)
            .enter()
            .append("path")
            .attr("class", d => `departement dep-${d.properties.code}`)
            .attr("d", path)
            .attr("fill", "white")
            .attr("stroke", "#CCCCCC")
            .attr("stroke-width", "0.5")
            .on("mouseover", function(event, d) {
                const franchise = franchises.find(f => f.departements.includes(d.properties.code));
                if (franchise && (!selectedCity || selectedCity === franchise.ville)) {
                    highlightDepartements(franchise.ville, true);
                }
            })
            .on("mouseout", function(event, d) {
                const franchise = franchises.find(f => f.departements.includes(d.properties.code));
                if (franchise && !selectedCity) {
                    highlightDepartements(franchise.ville, false);
                }
            })
            .on("click", function(event, d) {
                event.stopPropagation();
                const franchise = franchises.find(f => f.departements.includes(d.properties.code));
                if (franchise) {
                    selectCity(franchise.ville);
                    showFranchiseInfo(franchise.ville);
                    centerOnCity(franchise.ville);
                }
            });

        // 5. Dessiner la France (contour uniquement pour les départements non-français)
        console.log("Dessin de la France...");
        viewport.append("path")
            .datum(franceData)
            .attr("d", path)
            .attr("fill", "none")
            .attr("stroke", "#CCCCCC")
            .attr("stroke-width", "0.5")
            .attr("class", "france-border");

        // 6. Ajouter les villes
        console.log("Ajout des villes...");
        cityGroups = viewport.selectAll("g.city")
            .data(cities)
            .enter()
            .append("g")
            .attr("class", "city")
            .attr("transform", d => `translate(${projection(d.coords)})`)
            .on("mouseover", function(event, d) {
                if (!selectedCity) {
                    console.log("Survol de la ville:", d.name);
                    highlightDepartements(d.name, true);
                }
            })
            .on("mouseout", function(event, d) {
                if (!selectedCity) {
                    highlightDepartements(d.name, false);
                }
            })
            .on("click", function(event, d) {
                event.stopPropagation();
                selectCity(d.name);
                showFranchiseInfo(d.name);
                centerOnCity(d.name);
            });

        // Ajouter les cercles pour les villes
        cityGroups.append("circle")
            .attr("class", "city-marker")
            .attr("r", 4);

        // Ajouter les noms des villes
        cityGroups.append("text")
            .attr("x", 8)
            .attr("y", 4)
            .text(d => d.name);

        // Ajouter l'écouteur d'événement pour le clic sur la carte
        d3.select("#map").on("click", handleMapClick);

        console.log("Initialisation terminée");

    } catch (error) {
        console.error("Erreur lors de l'initialisation:", error);
    }
}

// Fonction pour normaliser les caractères spéciaux
function normalizeString(str) {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
}

// Fonction pour afficher les informations du franchisé
function showFranchiseInfo(cityName) {
    const cleanCityName = cityName.replace('SEGUR', '').trim();
    const franchise = franchises.find(f => normalizeString(f.ville) === normalizeString(cleanCityName));
    
    if (franchise) {
        // Mettre à jour le titre
        document.querySelector('.card-title').innerHTML = `SEGUR <span class="city-name">${franchise.ville}</span>`;
        
        // Décaler la carte
        document.querySelector('.map-container').classList.add('shifted');
        
        // Afficher le panneau de détails
        document.querySelector('.franchise-details-panel').classList.add('active');
        
        // Créer les onglets
        const tabsContainer = document.querySelector('.franchise-tabs');
        tabsContainer.innerHTML = '';
        
        if (Array.isArray(franchise.equipe) && franchise.equipe.length > 0) {
            // Cas avec plusieurs membres d'équipe
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
                tab.onclick = (event) => {
                    event.stopPropagation();
                    updateFranchiseDetails(franchise, index);
                };
                tabsContainer.appendChild(tab);
            });
            
            // Afficher les détails du premier membre
            updateFranchiseDetails(franchise, 0);
        } else {
            // Cas avec un seul membre
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
            updateFranchiseDetails(franchise, null);
        }
    }
}

// Fonction pour mettre à jour les détails d'un membre
function updateFranchiseDetails(franchise, memberIndex) {
    const membre = memberIndex !== null ? franchise.equipe[memberIndex] : franchise;
    
    // Mettre à jour les onglets actifs
    document.querySelectorAll('.franchise-tab').forEach((tab, index) => {
        tab.classList.toggle('active', index === memberIndex);
    });
    
    // Mettre à jour les informations
    const elements = {
        name: document.querySelector('.franchise-name'),
        firstname: document.querySelector('.franchise-firstname'),
        email: document.querySelector('.franchise-email'),
        phone: document.querySelector('.franchise-phone'),
        departments: document.querySelector('.franchise-departments')
    };
    
    if (elements.name) elements.name.textContent = membre.nom;
    if (elements.firstname) elements.firstname.textContent = membre.prenom;
    if (elements.email) elements.email.textContent = membre.email;
    if (elements.phone) elements.phone.textContent = membre.telephone;
    
    // Formater les départements
    if (elements.departments) {
        const depsHtml = franchise.departements
            .map(dep => `<span>${dep}</span>`)
            .join('');
        elements.departments.innerHTML = depsHtml;
    }
}

// Fonction pour fermer la modale
function closeModal() {
    document.querySelector('.modal-overlay').classList.remove('active');
    document.querySelector('.franchise-modal').classList.remove('active');
}

// Ajouter les écouteurs d'événements pour la modale
document.addEventListener('DOMContentLoaded', () => {
    // Fermer la modale en cliquant sur le bouton de fermeture
    document.querySelector('.modal-close').addEventListener('click', (event) => {
        event.stopPropagation();
        closeModal();
    });
    
    // Fermer la modale en cliquant sur l'overlay
    document.querySelector('.modal-overlay').addEventListener('click', (event) => {
        if (event.target.classList.contains('modal-overlay')) {
            closeModal();
        }
    });

    // Empêcher la propagation des clics depuis la modale
    document.querySelector('.franchise-modal').addEventListener('click', (event) => {
        event.stopPropagation();
    });
});

// Modifier la fonction centerOnCity pour afficher la modale
function centerOnCity(cityName) {
    const cleanCityName = cityName.replace('SEGUR', '').trim();
    // Utiliser une comparaison plus souple pour trouver la ville
    const city = cities.find(c => {
        const normalizedCityName = c.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
        const normalizedCleanName = cleanCityName.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
        return normalizedCityName === normalizedCleanName;
    });
    
    if (city) {
        // Réinitialiser tous les marqueurs
        d3.selectAll(".city-marker")
            .classed("selected", false)
            .attr("r", 4);
        
        // Sélectionner le marqueur de la ville
        const cityMarker = cityGroups
            .filter(d => {
                const normalizedName = d.name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
                const normalizedCleanName = cleanCityName.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toUpperCase();
                return normalizedName === normalizedCleanName;
            })
            .select(".city-marker");
            
        // Mettre en évidence le marqueur
        cityMarker.classed("selected", true)
                 .attr("r", 8);
            
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

// Création du zoom D3
zoom = d3.zoom()
    .scaleExtent([0.5, 8]) // Permettre un zoom plus important
    .on('zoom', (event) => {
        d3.select('#viewport')
            .attr('transform', event.transform);
    });

// Ajouter les gestionnaires d'événements pour les contrôles de zoom
document.addEventListener('DOMContentLoaded', () => {
    const ZOOM_FACTOR = 1.5;

    // Zoom in
    document.getElementById('zoom-in').addEventListener('click', () => {
        const currentTransform = d3.zoomTransform(svg.node());
        svg.transition()
            .duration(200)
            .ease(d3.easeLinear)
            .call(
                zoomBehavior.transform,
                d3.zoomIdentity
                    .translate(currentTransform.x, currentTransform.y)
                    .scale(currentTransform.k * ZOOM_FACTOR)
            );
    });

    // Zoom out
    document.getElementById('zoom-out').addEventListener('click', () => {
        const currentTransform = d3.zoomTransform(svg.node());
        svg.transition()
            .duration(200)
            .ease(d3.easeLinear)
            .call(
                zoomBehavior.transform,
                d3.zoomIdentity
                    .translate(currentTransform.x, currentTransform.y)
                    .scale(currentTransform.k / ZOOM_FACTOR)
            );
    });

    // Reset
    document.getElementById('reset').addEventListener('click', () => {
        svg.transition()
            .duration(300)
            .ease(d3.easeLinear)
            .call(zoomBehavior.transform, d3.zoomIdentity);
    });

    // Toggle shortcuts
    document.getElementById('shortcuts-toggle').addEventListener('click', () => {
        const shortcuts = document.querySelector('.shortcuts-tooltip');
        shortcuts.classList.toggle('active');
    });

    // Fermer les raccourcis en cliquant ailleurs
    document.addEventListener('click', (event) => {
        if (!event.target.matches('#shortcuts-toggle')) {
            const shortcuts = document.querySelector('.shortcuts-tooltip');
            if (shortcuts.classList.contains('active')) {
                shortcuts.classList.remove('active');
            }
        }
    });
}); 

// Gestion du redimensionnement
window.addEventListener('resize', () => {
    const dimensions = updateDimensions();
    width = dimensions.width;
    height = dimensions.height;
    
    svg.attr("width", width)
       .attr("height", height);
    
    projection = d3.geoMercator()
        .center([FRANCE_CENTER.longitude, FRANCE_CENTER.latitude])
        .scale(calculateOptimalScale(width, height))
        .translate([width / 2, height / 2]);

    path = d3.geoPath().projection(projection);
    
    if (departements && cityGroups) {
        d3.selectAll(".departement")
            .attr("d", path);
            
        cityGroups.attr("transform", d => `translate(${projection(d.coords)})`);
        
        svg.transition()
           .duration(300)
           .call(zoom.transform, d3.zoomIdentity);
    }
}); 

// Fonction pour fermer le panneau des franchises
function closeFranchisePanel() {
    // Remettre la carte à sa position initiale
    document.querySelector('.map-container').classList.remove('shifted');
    
    // Masquer le panneau
    document.querySelector('.franchise-details-panel').classList.remove('active');
    
    // Réinitialiser le marqueur sélectionné
    d3.selectAll(".city-marker")
        .classed("selected", false)
        .attr("r", 4);
}

// Ajoutons la fonction de mise en évidence des départements
function highlightDepartements(cityName, highlight = true, isSelected = false) {
    const franchise = franchises.find(f => f.ville === cityName);
    if (!franchise) return;

    // Couleurs et styles
    const baseColor = "white";
    const highlightColor = "#e31e26"; // Rouge SEGUR
    const baseStroke = "#CCCCCC";
    const highlightStroke = "#cc1a21"; // Version plus foncée du rouge SEGUR pour les bordures
    
    // Opacités et épaisseurs
    const fillOpacity = highlight ? (isSelected ? 0.85 : 0.75) : 1;
    const strokeWidth = highlight ? (isSelected ? "1.5" : "1") : "0.5";

    franchise.departements.forEach(depCode => {
        d3.select(`.dep-${depCode}`)
            .transition()
            .duration(200)
            .attr("fill", highlight ? highlightColor : baseColor)
            .attr("fill-opacity", fillOpacity)
            .attr("stroke", highlight ? highlightStroke : baseStroke)
            .attr("stroke-width", strokeWidth)
            .style("filter", highlight ? "drop-shadow(0 0 2px rgba(227, 30, 38, 0.3))" : "none");
    });
}

// Fonction pour gérer la sélection d'une ville
function selectCity(cityName) {
    console.log("Sélection de la ville:", cityName, "Ville actuellement sélectionnée:", selectedCity);
    
    // Si on clique sur la ville déjà sélectionnée, on la désélectionne
    if (selectedCity === cityName) {
        console.log("Désélection de la ville:", cityName);
        selectedCity = null;
        highlightDepartements(cityName, false);
    } else {
        // Si une autre ville était sélectionnée, on retire sa mise en évidence
        if (selectedCity) {
            console.log("Désélection de l'ancienne ville:", selectedCity);
            highlightDepartements(selectedCity, false);
        }
        // On sélectionne la nouvelle ville
        console.log("Nouvelle sélection:", cityName);
        selectedCity = cityName;
        highlightDepartements(cityName, true, true);
    }
}

// Fonction pour gérer le clic sur la carte (en dehors des villes)
function handleMapClick(event) {
    // Ne rien faire si on est en train de faire glisser la carte
    if (isDragging) return;
    
    // Si le clic n'est pas sur une ville ou un département d'une ville sélectionnée
    const clickedElement = event.target;
    const isCity = clickedElement.classList.contains('city-marker') || 
                  clickedElement.classList.contains('city-label') ||
                  clickedElement.parentElement.classList.contains('city');
                  
    if (!isCity && selectedCity) {
        console.log("Clic en dehors d'une ville, désélection de:", selectedCity);
        highlightDepartements(selectedCity, false);
        selectedCity = null;
    }
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