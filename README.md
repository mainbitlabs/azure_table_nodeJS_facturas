# Azure Table Node JS

¡RECUERDA! ESTOS CODIGOS NO TIENE key_azure.js DEBERAS INSERTAR ESTE ARCHIVO CON LAS CLAVES CORRESPONDIENTES PARA PODER USARLOS.    

Una forma de usar estos codigos es siguendo el orden en lo que fueron enumerados, solo hay que abrirlos y cambiar el proyecto al cual apuntar la tarea.

En caso de requerir una función especifica, doy una descripción de que hace cada codigo a continuación:

## 01FactTb2.js

Este codigo inserta fecha y numero de factura en la tabla 2 (o 1 si es necesario, solo hay que cambiar el blanco).

## 02VerficarAprobados.js

Este codigo comprueba en la tabla 4 que documentos requieren estar aprobados para exportar una entidad a la tabla 5 de la tabla 2 (o 1 si es necesario, solo hay que cambiar el blanco).

Una vez encuentre una entidad con los criterios buscados, se crea una entidad en la tabla 5 (con fecha y numero de factura si la tiene) y modifica la entidad colocandola en esta Procesado en la tabla 2.

## 03FactTb5.js

Este codigo busca en la tabla 5 las entidades que no tiene numero de factura, en caso de encontrar alguna, el programa busca en la tabla 2 y tuma su numero de factura para insertarlo en la tabla 5.

## 04EnviarCorreos.js

Este codigo analiza la tabla 5 y busca que archivos no tienen numero de factura. En caso de encontrarlos, guarda las RowKey y las enviar por correo para notificar que deben ser facturadas.