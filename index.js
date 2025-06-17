const canadaStyle = new ol.style.Style({
  fill: new ol.style.Fill({
    color: [203, 194, 185, 1]
  }),
  stroke: new ol.style.Stroke({
    color: [177, 163, 148, 0.5],
    width: 2,
    lineCap: 'round'
  })
});

const canadaStyleSelect = new ol.style.Style({
  fill: new ol.style.Fill({
      color: [255, 0, 0, 1]
  }),
  stroke: new ol.style.Stroke({
    color: [177, 163, 148, 0.5],
    width: 2,
    lineCap: 'round'
  })
});

const pointStyle = new ol.style.Style({
  image: new ol.style.Circle({
    radius: 5,
    fill : new ol.style.Fill({
      color: '#666666'
    }),

    stroke: new ol.style.Stroke({
      color: '#bada55'
    })
  })
});

const view = new ol.View({
  center: ol.proj.transform([-73.56, 45.50],'EPSG:4326', 'EPSG:3857'),
  zoom: 3
});

const vectorLayer1 = new ol.layer.Vector({
  id: 'Canada',
  title: 'Canada',
  source: new ol.source.Vector({
    url: './data/canada.geojson',
    format: new ol.format.GeoJSON(),
  }),
  style: canadaStyle
});
vectorLayer1.setVisible(true);

const vectorLayer2 = new ol.layer.Vector({
  id: 'Circonscription',
  title: 'Circonscription',
  source: new ol.source.Vector({
    url: './data/circonscription_geojson2.geojson',
    format: new ol.format.GeoJSON(),
  }),
  style: circonscriptionStyleFunction  // style basée sur la légende du parti
});
vectorLayer2.setVisible(true);

const vectormap = new ol.layer.Group({
  title: 'Couches',
  fold: 'open',
  layers: [vectorLayer1, vectorLayer2]
});

//  Fonds cartographiques
// 1. OpenStreetMap
const osmLayer = new ol.layer.Tile({
  title: 'OpenStreetMap',
  type: 'base',
  source: new ol.source.OSM()
});

// 2. Fond de carte satellite
const satelliteLayer = new ol.layer.Tile({
  title: 'Satellite',
  type: 'base',
  visible: true, // Changé à true pour rendre visible
  source: new ol.source.XYZ({
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attributions: 'Tiles © Esri — Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
  })
});

// 3. Fond de carte topographique (ESRI)
const topoLayer = new ol.layer.Tile({
  title: 'Topographique',
  type: 'base',
  visible: true,
  source: new ol.source.XYZ({
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
    attributions: 'Tiles © Esri'
  })
});

// 4. Fond de carte Carto-DB Positron
const cartoDBLayer = new ol.layer.Tile({
  title: 'CartoDB Light',
  type: 'base',
  visible: true,
  source: new ol.source.XYZ({
    url: 'https://{a-c}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png',
    attributions: '© OpenStreetMap contributors, © CartoDB'
  })
});

osmLayer.setVisible(true);

// Groupe de fonds de carte
var basemap = new ol.layer.Group({
  title: 'Fonds cartographiques',
  fold: 'open',
  visible: true,
  layers: [osmLayer, satelliteLayer, topoLayer, cartoDBLayer]
});

// Couleurs pour les partis politiques du Québec
const partyColors = {
  'C.A.Q.-E.F.L.': [0, 120, 190],          // Bleu 
  'P.L.Q./Q.L.P.': [220, 20, 60],           // Rouge
  'Q.S.': [255, 140, 0],                    // Orange
  'P.Q.': [70, 130, 80],                   // Vert
  'P.C.Q.': [128, 0, 128],                  // Violet
  'Independent': [128, 128, 128],           // Gris 
  'Other': [169, 169, 169]                  // Gris foncé
};

// Obtention de la couleur selon le parti gagnant
function getPartyColor(feature) {
  const properties = feature.getProperties();
  
  // Utiliser les noms de champs spécifiques du fichier Excel
  const winningParty = properties['candidat_4'] ||  // Parti gagnant principal
                      properties.winning_party || 
                      properties.party || 
                      properties.winner || 
                      properties.parti_gagnant ||
                      properties.PARTY ||
                      properties.WINNER ||
                      'Other';
  
  // Normalisation du nom du parti
  const normalizedParty = winningParty.toString().trim();
  
  for (const [party, color] of Object.entries(partyColors)) {
    if (party === normalizedParty || 
        party.toLowerCase().includes(normalizedParty.toLowerCase()) || 
        normalizedParty.toLowerCase().includes(party.toLowerCase())) {
      return color;
    }
  }
  
  return partyColors['Other'];
}

// Style pour les circonscriptions basé sur le parti gagnant
function circonscriptionStyleFunction(feature) {
  return new ol.style.Style({
    fill: new ol.style.Fill({
      color: getPartyColor(feature)
    }),
    stroke: new ol.style.Stroke({
      color: [0, 0, 0, 0.8],
      width: 1
    })
  });
}

const circonscriptionStyleSelect = new ol.style.Style({
  fill: new ol.style.Fill({
    color: [255, 165, 0, 0.9]  // Orange au survol
  }),
  stroke: new ol.style.Stroke({
    color: [255, 255, 255, 1],
    width: 3
  })
});

// Interaction avec les circonscriptions lors du survol
const selectInteraction = new ol.interaction.Select({
  condition: ol.events.condition.pointerMove,
  layers: function (layer) {
    return layer.get('id') == 'Circonscription';
  },
  style: circonscriptionStyleSelect
});

// Interaction avec les circonscriptions lors du clic
const clickInteraction = new ol.interaction.Select({
  condition: ol.events.condition.click,
  layers: function (layer) {
    return layer.get('id') == 'Circonscription';
  },
  style: new ol.style.Style({
    fill: new ol.style.Fill({
      color: [255, 0, 0]  // Rouge pour la sélection au clic
    }),
    stroke: new ol.style.Stroke({
      color: [255, 255, 255],
      width: 4
    })
  })
});

const map = new ol.Map({
  target: 'map'
});

// Événement lors du survol d'une circonscription
selectInteraction.on('select', function(event) {
  const selectedFeatures = event.selected;
  
  if (selectedFeatures.length > 0) {
    const feature = selectedFeatures[0];
    const properties = feature.getProperties();
    
    // Utiliser les noms de champs spécifiques du fichier Excel
    const winningParty = properties['candidat_4'] || 'Non spécifié';        // Parti gagnant
    const votes = properties['candidat_5'] || '';                           // Votes du gagnant
    const percentage = properties['candidat_6'] || '';                      // Pourcentage du gagnant
    const totalVotes = properties['circonsc_7'] || '';                     // Total votes valides
    const participation = properties['circonsc11'] || '';                   // Taux de participation
    
    // Nom de la circonscription
    let circonscriptionName = properties['NM_CEP'] ||                       // Nom circonscription
                             properties['circonscri'] ||
                             properties.name || 
                             properties.nom || 
                             properties.NAME || 
                             'Circonscription';
    
    // Construire l'information de survol avec parti et chiffres
    let hoverInfo = `
      <div style="background-color: rgba(0, 0, 0, 0.85); color: white; padding: 8px; border-radius: 4px; font-family: Arial, sans-serif; font-size: 12px; line-height: 1.4; min-width: 200px;">
        <div style="font-weight: bold; margin-bottom: 6px; font-size: 13px;">${circonscriptionName}</div>
        <div style="color: rgb(${getPartyColor(feature).slice(0,3).join(',')});">● <strong>${winningParty}</strong></div>`;
    
    // Ajouter les statistiques disponibles
    if (votes) {
      const formattedVotes = typeof votes === 'number' ? votes.toLocaleString() : votes;
      hoverInfo += `<div style="margin-top: 3px;"><strong>Votes:</strong> ${formattedVotes}</div>`;
    }
    
    if (percentage) {
      hoverInfo += `<div><strong>Pourcentage:</strong> ${percentage}%</div>`;
    }
    
    if (totalVotes) {
      const formattedTotal = typeof totalVotes === 'number' ? totalVotes.toLocaleString() : totalVotes;
      hoverInfo += `<div><strong>Total votes:</strong> ${formattedTotal}</div>`;
    }
    
    if (participation) {
      hoverInfo += `<div><strong>Participation:</strong> ${participation}%</div>`;
    }
    
    document.getElementById('hover-info').innerHTML = hoverInfo;
  } else {
    document.getElementById('hover-info').innerHTML = `
      <div style="background-color: rgba(0, 0, 0, 0.7); color: white; padding: 5px 10px; border-radius: 3px; font-family: Arial, sans-serif; font-size: 12px;">
        Survolez une circonscription
      </div>`;
  }
});

// DIFFERENTS CONTROLES UTILISES
var layerSwitcher = new ol.control.LayerSwitcher({
  reverse: true,
  groupSelectStyle: 'group'
});

// Contrôle de position de la souris
const mousePositionControl = new ol.control.MousePosition({
  coordinateFormat: function(coord) {
    // Convertion en degrés décimaux
    const lonLat = ol.proj.transform(coord, 'EPSG:3857', 'EPSG:4326');
    return 'Lon: ' + lonLat[0].toFixed(6) + ', Lat: ' + lonLat[1].toFixed(6);
  },
  projection: 'EPSG:4326',
  className: 'custom-mouse-position',
  target: document.getElementById('mouse-position'),
});

// Contrôle de barre d'échelle
const scaleLineControl = new ol.control.ScaleLine({
  units: 'metric',
  bar: true,
  steps: 3,
  text: true,
  minWidth: 100
});

// Ajout des éléments à la carte
map.addLayer(basemap);
map.addLayer(vectormap);
map.setView(view);
map.addInteraction(selectInteraction);
map.addInteraction(clickInteraction);
map.addControl(layerSwitcher);
map.addControl(mousePositionControl);
map.addControl(scaleLineControl);

setTimeout(() => {
  
  // Légende des couleurs
  let legendElement = document.getElementById('color-legend');
  if (!legendElement) {
    legendElement = document.createElement('div');
    legendElement.id = 'color-legend';
    document.body.appendChild(legendElement);
  }
  legendElement.innerHTML = createColorLegend();
  
  // Position de la souris
  let mouseElement = document.getElementById('mouse-position');
  if (!mouseElement) {
    mouseElement = document.createElement('div');
    mouseElement.id = 'mouse-position';
    document.body.appendChild(mouseElement);
  }
  
  // Informations de survol
  let hoverElement = document.getElementById('hover-info');
  if (!hoverElement) {
    hoverElement = document.createElement('div');
    hoverElement.id = 'hover-info';
    hoverElement.innerHTML = 'Survolez une circonscription';
    document.body.appendChild(hoverElement);
  }
  
  // Informations détaillées basées sur la table attributaire (jointure spatiale)
  let featureElement = document.getElementById('feature-info');
  if (!featureElement) {
    featureElement = document.createElement('div');
    featureElement.id = 'feature-info';
    featureElement.innerHTML = '<p>Baladez-vous sur une circonscription pour voir ses statistiques</p>';
    document.body.appendChild(featureElement);
  }
}, 1000);
