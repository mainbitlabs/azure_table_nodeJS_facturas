//Paquetes:
var azure = require('azure-storage');

//Crear conexión:
var azure2 = require('./keys_azure'); //Importación de llaves
var tableSvc = azure.createTableService(azure2.myaccount, azure2.myaccesskey);

//Query con filtro para obtener entidades de la tabla 5 sin No_Fact:
var query = new azure.TableQuery()
    .where('No_Fact eq ?', '');
var nextContinuationToken = null;

//Tabla origen:
var tabla2 = "botdyesatb02";
var tabla5 = "botdyesatb05";

//Variables:
var contador = 0;
var finalizar = false;

//No es necesario completar el JSON, puede esta vacio por que toma el valor
//de la entidad durante el programa, pero tenerlo así sirve de guia para trabajar:
var task = {
    PartitionKey: { '_': '' },
    RowKey: { '_': '' },
    No_Fact: { '_': '' },
}

//Programa:
async function promesa() {
    return new Promise(function(resolve, reject) {
        //Blucle Tabla5:
        tableSvc.queryEntities(tabla5, query, nextContinuationToken, function(error, results, response) {
            if (!error) {
                results.entries.forEach(function(entry) {
                    //Obtener entidad tabla 1:
                    tableSvc.retrieveEntity(tabla2, `${entry['Asociado']['_']}`, `${entry['RowKey']['_']}`, function(error2, result, response2) {
                        if (!error2) {
                            //Confirmar si en la Tabla 2 hay No_Fact:
                            if (result['No_Fact']['_'] != "" && result['Status']['_'] == "Procesado") {
                                //Contar entidades actualizadas:
                                console.log(`Actualizando entidad con la serie ${result['RowKey']['_']}`);
                                contador++;

                                //Colocar datos para unir el JSON con la Entidad:
                                task['PartitionKey']['_'] = result['Proyecto']['_'];
                                task['RowKey']['_'] = result['RowKey']['_'];
                                task['No_Fact']['_'] = result['No_Fact']['_'];

                                //Unir JSON con la entiadad:
                                tableSvc.mergeEntity(tabla5, task, function(errorMerge, resultMerge, responseMerge) {
                                    if (!errorMerge) {
                                        //Trabajando correctamente...
                                    } else {
                                        console.log("Hay un error.");
                                    }
                                });
                            }
                        }
                    });

                });
            }

            //Token que permite continuar despues de leer 1000 rows:
            if (results.continuationToken) {
                nextContinuationToken = results.continuationToken;
                resolve();
            } else {
                finalizar = true;
                resolve();
            }

        }); //Fin Query Tabla5 -----------------------
    });
}

//Funcion que se ejecuta el final del programa:
async function resultado() {
    console.log(`Se modificaron ${contador} entidades.`);
}

//Programa
async function working() {

    //Reiniciar token:
    nextContinuationToken = null

    //Bucle:
    do {
        await promesa();
    } while (finalizar == false);

    resultado();
}

//Inicia el trabajo:
working();