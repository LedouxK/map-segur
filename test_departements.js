// Test de lecture du fichier departements.json
fetch('./data/departements.json')
    .then(response => response.json())
    .then(data => {
        console.log('Données des départements chargées avec succès:');
        console.log('Nombre de départements:', Object.keys(data).length);
        console.log('Exemple de département:', data[Object.keys(data)[0]]);
    })
    .catch(error => {
        console.error('Erreur lors du chargement des départements:', error);
    }); 