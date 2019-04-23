//---------------------------------------------
// Modicar:
var proyectoTrabajando = "OperacionInterna";
//---------------------------------------------

//Paquetes:
var azure = require('azure-storage');

//Crear conexión:
var azure2 = require('./keys_azure'); //Importación de llaves
var tableSvc = azure.createTableService(azure2.myaccount, azure2.myaccesskey);

//Tabla origen:
var tablaUsar = "botdyesatb02"

var bajaExiste = "";
var borradoExiste = "";
var checkExiste = "";
var resguardoExiste = "";
var hojaDeServicioExiste = "";
var contadorX = 0;

var updateTaskTabla2;

//JSON tabla4:
var tablaUsar4 = "botdyesatb04"
var taskTabla4 = {
    NumDoc: { '_': '' }
};

//JSON tabla5:
var tablaUsar5 = "botdyesatb05"
var taskTabla5 = {
    PartitionKey: { '_': 'Proyecto' },
    RowKey: { '_': 'Serie' },
    Timestamp: { '_': '' },
    Asociado: { '_': '' },
    Baja: { '_': '' },
    Borrado: { '_': '' },
    Check: { '_': '' },
    Resguardo: { '_': '' },
    HojaDeServicio: { '_': '' },
    Status: { '_': '' },
    No_Fact: { '_': '' }
};

//Query:
var query = new azure.TableQuery()
    .where('Proyecto eq ?', proyectoTrabajando);
var nextContinuationToken = null;
var finalizar = false;
var falla = false;

//Contador:
var aceptCount = 0;
var proyectoCount = 0;
var countAprobados = 0;
var countEntities = 0;
var total = 0;

//Programa
async function working() {

    //Lectura de tabla 4;
    tableSvc.retrieveEntity(tablaUsar4, "Proyecto", proyectoTrabajando, function(error, result, response) {
        if (!error) {

            taskTabla4 = result;

            if (result['Baja']['_'] == "X") {
                bajaExiste = "X";
            }
            if (result['Borrado']['_'] == "X") {
                borradoExiste = "X";
            }
            if (result['Check']['_'] == "X") {
                checkExiste = "X";
            }
            if (result['Resguardo']['_'] == "X") {
                resguardoExiste = "X";
            }
            if (result['HojaDeServicio']['_'] == "X") {
                hojaDeServicioExiste = "X";
            }

            //Contador de X:
            if (bajaExiste == "X") {
                contadorX++;
            }
            if (borradoExiste == "X") {
                contadorX++;
            }
            if (checkExiste == "X") {
                contadorX++;
            }
            if (resguardoExiste == "X") {
                contadorX++;
            }
            if (hojaDeServicioExiste == "X") {
                contadorX++;
            }
        }
    });

    Bucle();
}

async function Bucle() {
    //Bucle:
    await promesa();
    if (falla == false) {
        if (finalizar == false) {
            setTimeout(function() { Bucle() }, 10000);
        } else {
            setTimeout(function() { resultado() }, 10000);
        }
    } else {
        console.log('El programa se ha detenido por que se ha detectado un error, vuelva a intentalo.');
    }
}


function promesa() {
    return new Promise(function(resolve, reject) {
        tableSvc.queryEntities(tablaUsar, query, nextContinuationToken, function(error, results, response) {
            if (!error) {
                //Recorrido por row:
                results.entries.forEach(function(entry) {

                    //Conteo de aprobados
                    aceptCount = 0;

                    if (entry['Baja']['_'] == "Aprobado" && bajaExiste == "X") {
                        aceptCount++;
                    }
                    if (entry['Borrado']['_'] == "Aprobado" && borradoExiste == "X") {
                        aceptCount++;
                    }
                    if (entry['Check']['_'] == "Aprobado" && checkExiste == "X") {
                        aceptCount++;
                    }
                    if (entry['Resguardo']['_'] == "Aprobado" && resguardoExiste == "X") {
                        aceptCount++;
                    }
                    if (entry['HojaDeServicio']['_'] == "Aprobado" && hojaDeServicioExiste == "X") {
                        aceptCount++;
                    }

                    console.log(`Aceptados: ${aceptCount}`);
                    if (aceptCount == contadorX) {
                        //Colocación de la información:
                        if (aceptCount == contadorX && entry['Status']['_'] != "Procesado") {
                            updateTaskTabla2 = entry;
                            proyectoCount++;
                            //Tarea Tabla5: 
                            taskTabla5['PartitionKey']['_'] = entry['Proyecto']['_'];
                            taskTabla5['RowKey']['_'] = entry['RowKey']['_'];
                            taskTabla5['Asociado']['_'] = entry['PartitionKey']['_'];
                            taskTabla5['Baja']['_'] = entry['Baja']['_'];
                            taskTabla5['Borrado']['_'] = entry['Borrado']['_'];
                            taskTabla5['Check']['_'] = entry['Check']['_'];
                            taskTabla5['Resguardo']['_'] = entry['Resguardo']['_'];
                            taskTabla5['HojaDeServicio']['_'] = entry['HojaDeServicio']['_'];
                            taskTabla5['No_Fact']['_'] = entry['No_Fact']['_'];
                            if (falla == false) {
                                tableSvc.insertOrMergeEntity(tablaUsar5, taskTabla5, function(error, result, response) {
                                    if (!error) {
                                        console.log("La entidad se agrego o remplazo correctamente a la tabla 5");
                                    } else {
                                        console.log(`Hay un error`);
                                        falla == true;
                                    }

                                });
                                //Tarea Tabla2:
                                updateTaskTabla2['Status']['_'] = "Procesado";
                                tableSvc.mergeEntity(tablaUsar, updateTaskTabla2, function(error, result, response) {
                                    if (!error) {
                                        console.log("Se hizó un mergeEntity correctamente sobre la tabla 2.");
                                    } else {
                                        console.log(`Hay un error`);
                                        falla == true;
                                    }
                                });
                            }
                        }
                        countAprobados++;
                    } else {
                        countEntities++;
                    }
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
        });
    });
}

//Funcion que se ejecuta el final del programa:
function resultado() {
    //Modificando tabla 4:
    taskTabla4['NumDoc']['_'] = countAprobados;

    //Remplazar tablara 4 con su contenido y modificando unicamente el conteo actual:
    tableSvc.mergeEntity(tablaUsar4, taskTabla4, function(error, result, response) {
        if (!error) {
            console.log("Se actualizo o creo una entidad en la tabla 4 con su respectiba información.");
        } else {
            console.log("Hay un error.");
        }
    });

    console.log(`${countAprobados} entidades corresponden con los criterios.`);

    total = countAprobados + countEntities;
    console.log(`Total de campos analizados: ${total}`);
    console.log(`Se esta buscando ${contadorX} documentos en el proyecto.`);
    console.log(`${proyectoCount} corresponden con el proyecto.`);
}

//Inicia el trabajo:
working();