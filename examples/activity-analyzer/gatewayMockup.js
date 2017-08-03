"use strict";

var express = require('express');
var bodyParser = require('body-parser');
var logger = require('winston');

logger.level = 'info';

var app = express();
app.use(bodyParser.json({type: '*/*'}));

app.get('/v1/activity_analyzers/:id', function (req, res) {
    res.send(`{
        "status":"ok",
        "data":{
            "id":"1000",
            "name":"my analyzer",
            "organisation_id":"1000",
            "visit_analyzer_plugin_id":"1001",
            "group_id":"com.mediarithmics.visit-analyzer",
            "artifact_id":"default"}
        }`);
});

app.get('/v1/activity_analyzers/:id/properties', function (req, res) {

	res.send(`{
	"count":1,
	"data":
	[
		{
		"id":"2345",
		"technical_name":"analyzer_rules",
		"value":{
			"uri":"mics://data_file/tenants/10001/plugins_conf/activity_analyzer.conf"
				},
		"property_type":"DATA_FILE"
		}
	],
	"status":"ok"
}`);
	//res.sendStatus(500);

});

app.get('/v1/data_file/data', function (req, res) {

	const fileContent = `[
    {
        "activity_top_level": true,
        "properties": [
            {
                "mode": "replace",
                "name": "taux remplissage"
            },
            {
                "mode": "append",
                "name": "produit"
            }
        ],
        "events_name_to_property_mode": true,
        "events_name_to_property_destination": "type_page_list"
    },
    {
        "event_name": "Intention Santé",
        "properties": [
            "choix_optique",
            "choix_dentaire",
            "choix_soinscourants",
            "choix_hospitalisation"
        ]
    },
    {
        "event_name": "Intention Finance",
        "properties": [
            "type_pret",
            "nombre_pret",
            "montant_pret",
            "duree_pret",
            "assurance_auto_actuelle",
            "banque_actuelle",
            "capital_obseques",
            "capacite_epargne",
            "restant_du_pret",
            "mensualites_pret",
            "taux_endettement",
            "montant_imposition"
        ]
    },
    {
        "event_name": "Intention Logement",
        "properties": [
            "type_logement",
            "statut",
            "occupant",
            "surface",
            "capital_mobilier",
            "date_emmenagement"
        ]
    },
    {
        "event_name": "Intention Véhicule",
        "properties": [
            "projet_statut",
            "assurance_actuelle",
            "assurance_bonusmalus",
            "type_vehicule",
            "marque",
            "modele",
            "date_mec",
            "permis_moto_date",
            "permis_auto_date",
            "segment",
            "assurance_dateeffet",
            "energie",
            "ok_essai",
            "date_achat",
            "puissance",
            "financement",
            "assurance_sup_1an"
        ]
    },
    {
        "event_name": "Panel",
        "properties": [
            "mer01_nom",
            "mer02_nom",
            "mer03_nom",
            "panel_client_01",
            "panel_client_02",
            "panel_client_03"
        ]
    },
    {
        "event_name": "Intérêt",
        "properties": [
            "profil",
            "interesse_resiliation",
            "defiscalisation"
        ]
    },
    {
        "event_name": "$set_user_profile_properties",
        "properties": [
            "id_cotation",
            "phone_hash",
            "optin",
            "phone_type",
            "civilite",
            "sexe",
            "$birth_date",
            "statut",
            "profession",
            "travail_contrat",
            "situation_familiale",
            "enfants_nombre",
            "animal_espece",
            "animal_race",
            "revenu_mensuel",
            "nationalite",
            "effectif",
            "adresse_codepostal",
            "forme_juridique",
            "secteur_activite",
            "$is_client"
        ]
    }
]`;

	res.send(new Buffer(JSON.stringify(fileContent)));
	//res.sendStatus(500);

});

// Start the plugin and listen on port 8123
app.listen(8123, function () {
  logger.info('Gateway Mockup started, listening at 8123');
});