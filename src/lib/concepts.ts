export interface Concept {
  key: string;
  term: string;
  short: string;
  full: string;
  example?: string;
}

export const CONCEPTS: Concept[] = [
  {
    key: "iva",
    term: "IVA — Impuesto al Valor Agregado",
    short: "Impuesto del 13% sobre las ventas facturadas.",
    full:
      "Es un impuesto nacional del 13% que se aplica a la venta de bienes y servicios facturados en Bolivia. Cuando vendes con factura cobras un débito fiscal; cuando compras con factura obtienes un crédito fiscal. Pagas al SIN la diferencia (débito − crédito) cada mes.",
    example: "Si vendes Bs 1.000 con factura, cobras Bs 130 de IVA que luego declaras al SIN.",
  },
  {
    key: "it",
    term: "IT — Impuesto a las Transacciones",
    short: "3% sobre tus ingresos brutos.",
    full:
      "El IT es un impuesto del 3% que se aplica sobre el total de tus ingresos brutos mensuales, tengas o no utilidad. Se declara mensualmente en el Formulario 400. Lo bueno: lo que pagas de IUE al final del año se puede compensar contra el IT del año siguiente.",
    example: "Si facturas Bs 10.000 en el mes, pagas Bs 300 de IT.",
  },
  {
    key: "iue",
    term: "IUE — Impuesto sobre las Utilidades",
    short: "25% de tus utilidades netas anuales.",
    full:
      "El IUE grava las utilidades reales de tu emprendimiento al cierre de la gestión anual. La tasa general es del 25%. Se declara una vez al año, 120 días después del cierre. Puedes deducir gastos operativos respaldados con factura.",
    example: "Si tu utilidad anual es Bs 50.000, pagas Bs 12.500 de IUE.",
  },
  {
    key: "nit",
    term: "NIT — Número de Identificación Tributaria",
    short: "Tu identificador fiscal ante el SIN.",
    full:
      "El NIT es el número único que te identifica como contribuyente ante el Servicio de Impuestos Nacionales. Su último dígito determina la fecha de vencimiento mensual para presentar declaraciones (entre el 13 y 22 de cada mes).",
  },
  {
    key: "credito-fiscal",
    term: "Crédito Fiscal",
    short: "El IVA que puedes recuperar de tus compras.",
    full:
      "Cuando compras con factura a nombre de tu NIT y para tu actividad económica, el 13% de IVA que pagaste se convierte en crédito fiscal. Ese monto se resta al IVA que cobraste (débito fiscal), reduciendo lo que pagas al SIN.",
    example: "Compra Bs 226 con factura → crédito fiscal de Bs 26 (13%).",
  },
  {
    key: "debito-fiscal",
    term: "Débito Fiscal",
    short: "El IVA que cobraste en tus ventas.",
    full:
      "Es el 13% que cobras cuando emites facturas. Es dinero que no te pertenece: lo retienes para entregárselo al Estado en tu declaración mensual.",
  },
  {
    key: "utilidad",
    term: "Utilidad",
    short: "Lo que realmente ganas: ingresos menos gastos.",
    full:
      "La utilidad es la diferencia entre tus ingresos y todos tus gastos operativos. Es lo que queda para ti antes de calcular impuestos anuales (IUE).",
  },
  {
    key: "flujo-caja",
    term: "Flujo de Caja",
    short: "El dinero que entra y sale de tu negocio.",
    full:
      "El flujo de caja muestra cuándo entra y sale el dinero de tu emprendimiento. Un flujo positivo sostenido es señal de salud; uno negativo constante indica que estás quemando reservas.",
  },
  {
    key: "regimen-general",
    term: "Régimen General",
    short: "Régimen tributario con IVA, IT e IUE.",
    full:
      "Es el régimen aplicable a la mayoría de empresas y profesionales. Obliga a emitir factura, llevar registros contables y declarar IVA e IT mensualmente, y IUE anualmente.",
  },
  {
    key: "regimen-simplificado",
    term: "Régimen Tributario Simplificado (RTS)",
    short: "Pago bimestral fijo para pequeños comerciantes y artesanos.",
    full:
      "El RTS aplica a comerciantes minoristas, vivanderos y artesanos con capital y ventas limitadas. Se paga una cuota fija bimestral según categoría, sin emitir factura ni llevar contabilidad formal.",
  },
  {
    key: "siete-rg",
    term: "SIETE-RG",
    short: "Nuevo régimen para emprendedores: 5% de las ventas.",
    full:
      "Creado por el Decreto Supremo 5503, el SIETE-RG es un régimen de transición para empresas unipersonales y profesionales independientes con ventas anuales menores a Bs 250.000. Se paga un monotributo del 5% de las ventas brutas cada dos meses, que reemplaza al IVA, IT e IUE. Es voluntario y válido hasta por 3 años.",
    example: "Si vendes Bs 120.000 al año, tu monotributo anual sería Bs 6.000 (5%).",
  },
  {
    key: "punto-equilibrio",
    term: "Punto de equilibrio",
    short: "Cuánto vender para no ganar ni perder.",
    full:
      "Es la cantidad de ventas con la que cubres exactamente todos tus costos. Por debajo, pierdes; por encima, ganas. Se calcula dividiendo tus costos fijos entre el margen de contribución de cada unidad.",
    example: "Costos fijos Bs 1.500 y ganas Bs 3 por unidad → necesitas vender 500 unidades.",
  },
  {
    key: "margen-contribucion",
    term: "Margen de contribución",
    short: "Lo que deja cada venta para pagar tus costos fijos.",
    full:
      "Es el precio de venta menos el costo variable de una unidad. Ese dinero 'contribuye' a cubrir tus costos fijos y, una vez cubiertos, se vuelve ganancia.",
    example: "Vendes a Bs 10 algo que te cuesta Bs 4 → margen de contribución Bs 6.",
  },
  {
    key: "costo-fijo",
    term: "Costo fijo",
    short: "Lo que pagas siempre, vendas o no.",
    full:
      "Son los gastos que no cambian con las ventas: alquiler, sueldos, internet, servicios básicos. Debes cubrirlos incluso en un mes sin ventas, por eso conviene mantenerlos bajos al inicio.",
  },
  {
    key: "costo-variable",
    term: "Costo variable",
    short: "Lo que cuesta producir cada unidad.",
    full:
      "Son los gastos que suben o bajan según cuánto produces o vendes: insumos, materia prima, empaques. Si vendes el doble, este costo casi se duplica.",
  },
  {
    key: "estado-resultados",
    term: "Estado de Resultados",
    short: "El informe de si ganaste o perdiste en un periodo.",
    full:
      "Es un resumen contable que parte de tus ingresos y va restando el costo de ventas, los gastos operativos y los impuestos, hasta llegar a la utilidad neta. Muestra de dónde viene (y a dónde se va) tu ganancia.",
  },
  {
    key: "utilidad-bruta",
    term: "Utilidad bruta",
    short: "Ventas menos el costo directo de lo vendido.",
    full:
      "Es lo que queda después de restar a tus ventas solo el costo de los insumos o mercadería vendida (costo de ventas), antes de gastos fijos e impuestos. Un margen bruto sano deja espacio para todo lo demás.",
  },
  {
    key: "fondo-emergencia",
    term: "Fondo de emergencia",
    short: "Ahorro que cubre varios meses de costos fijos.",
    full:
      "Es un colchón de dinero reservado para sostener el negocio si las ventas caen o surge un imprevisto. Se recomienda acumular el equivalente a 3 meses de tus costos fijos.",
  },
  {
    key: "capital",
    term: "Capital",
    short: "El dinero y bienes invertidos en el negocio.",
    full:
      "Es todo lo que pusiste para arrancar y sostener tu emprendimiento: mercadería, herramientas, equipos y efectivo. En el Régimen Simplificado, tu capital define la categoría y el monto fijo que pagas.",
  },
  {
    key: "cierre-gestion",
    term: "Cierre de Gestión",
    short: "El fin del año contable de tu negocio (no siempre es en diciembre).",
    full:
      "Es la fecha en que cierra tu año contable para calcular el IUE. En Bolivia varía según el rubro: comercio y servicios cierran el 31 de diciembre, la industria el 31 de marzo, el sector agropecuario el 30 de junio y la minería el 30 de septiembre. Tienes 120 días después del cierre para declarar y pagar el IUE.",
    example: "Una tienda de ropa (comercio) cierra su gestión el 31 de diciembre; una fábrica textil (industria) cierra el 31 de marzo.",
  },
  {
    key: "ahorro-tributario",
    term: "Ahorro tributario",
    short: "Lo que dejas de pagar de IVA por exigir factura en tus compras.",
    full:
      "Cada vez que compras con factura, el 13% de esa compra se convierte en crédito fiscal y se resta del IVA que debes pagar por tus ventas. Ese descuento es tu ahorro tributario: dinero real que no sale de tu bolsillo gracias a pedir factura.",
    example: "Si compras Bs 1.000 con factura, generas Bs 130 de crédito fiscal que reduce el IVA que pagarás.",
  },
  {
    key: "balance-general",
    term: "Balance General",
    short: "Foto de lo que tienes, lo que debes y lo que es realmente tuyo.",
    full:
      "El Balance General (Estado de Situación Financiera) muestra, en una fecha dada, tus Activos (lo que tu negocio tiene: caja, banco, inventario, equipos), tus Pasivos (lo que debes: préstamos, cuentas por pagar) y tu Patrimonio (lo que realmente te pertenece: tu capital más las utilidades acumuladas). A diferencia del Estado de Resultados, que mide un período, el Balance mide un momento exacto. Aquí es un resumen simplificado que tú actualizas manualmente, no una contabilidad de partida doble.",
    example: "Si tienes Bs 5.000 en activos y debes Bs 2.000, tu patrimonio es Bs 3.000.",
  },
];

export function findConcept(key: string): Concept | undefined {
  return CONCEPTS.find((c) => c.key === key);
}
