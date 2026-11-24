document.addEventListener("DOMContentLoaded", function () {
    document.getElementById("formTerreno").addEventListener("submit", function (e) {
      e.preventDefault();
  
      const largura = parseFloat(document.getElementById("largura").value);
      const comprimento = parseFloat(document.getElementById("comprimento").value);
      const recuoLateral = parseFloat(document.getElementById("recuoLateral").value);
      const recuoFrenteFundo = parseFloat(document.getElementById("recuoFrenteFundo").value);
  
      const larguraConstrucao = largura - (2 * recuoLateral);
      const comprimentoConstrucao = comprimento - (2 * recuoFrenteFundo);
      const areaConstrucao = larguraConstrucao * comprimentoConstrucao;
      const perimetroConstrucao = 2 * (larguraConstrucao + comprimentoConstrucao);
  
      desenharPlanta(largura, comprimento, recuoLateral, recuoFrenteFundo);
  
      document.getElementById("areaTotal").innerText = areaConstrucao.toFixed(2) + " m²";
      document.getElementById("perimetro").innerText = perimetroConstrucao.toFixed(2) + " m";
      document.getElementById("dimensoes").innerText = larguraConstrucao.toFixed(2) + " x " + comprimentoConstrucao.toFixed(2) + " m";
    });
  });
  
  function desenharPlanta(largura, comprimento, recuoLateral, recuoFrenteFundo) {
    const svgNs = "http://www.w3.org/2000/svg";
    const svg = document.getElementById("plantaSvg");
    svg.innerHTML = "";
  
    const padding = 20;
    const svgWidth = 600;
    const svgHeight = 400;
    const escala = Math.min(
      (svgWidth - padding * 2) / largura,
      (svgHeight - padding * 2) / comprimento
    );
  
    const terrenoW = largura * escala;
    const terrenoH = comprimento * escala;
    const offsetX = (svgWidth - terrenoW) / 2;
    const offsetY = (svgHeight - terrenoH) / 2;
  
    const terreno = document.createElementNS(svgNs, "rect");
    terreno.setAttribute("x", offsetX);
    terreno.setAttribute("y", offsetY);
    terreno.setAttribute("width", terrenoW);
    terreno.setAttribute("height", terrenoH);
    terreno.setAttribute("class", "terrenoRect");
    svg.appendChild(terreno);
  
    const construcaoX = offsetX + (recuoLateral * escala);
    const construcaoY = offsetY + (recuoFrenteFundo * escala);
    const construcaoW = terrenoW - (2 * recuoLateral * escala);
    const construcaoH = terrenoH - (2 * recuoFrenteFundo * escala);
  
    const construcao = document.createElementNS(svgNs, "rect");
    construcao.setAttribute("x", construcaoX);
    construcao.setAttribute("y", construcaoY);
    construcao.setAttribute("width", construcaoW);
    construcao.setAttribute("height", construcaoH);
    construcao.setAttribute("class", "construcaoRect");
    svg.appendChild(construcao);
  }