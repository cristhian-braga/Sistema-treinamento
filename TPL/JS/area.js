document.addEventListener("DOMContentLoaded", function () {
    const corpoTabela = document.getElementById("corpoTabelaVertices");

    function adicionarLinhaVertice() {
        const numeroLinha = corpoTabela.children.length + 1;

        const linha = document.createElement("tr");
        linha.innerHTML = `
            <td>P${numeroLinha}</td>
            <td><input type="number" step="0.01" class="inputX"></td>
            <td><input type="number" step="0.01" class="inputY"></td>
            <td><button type="button" class="btnRemoverVertice">Remover</button></td>
        `;

        linha.querySelector(".inputX").addEventListener("input", redesenharPlanta);
        linha.querySelector(".inputY").addEventListener("input", redesenharPlanta);

        linha.querySelector(".btnRemoverVertice").addEventListener("click", function () {
            linha.remove();
            atualizarNumeracaoVertices();
            redesenharPlanta();
        });

        corpoTabela.appendChild(linha);
        redesenharPlanta();
    }

    function atualizarNumeracaoVertices() {
        const linhas = corpoTabela.querySelectorAll("tr");
        linhas.forEach(function (linha, indice) {
            linha.querySelector("td").innerText = "P" + (indice + 1);
        });
    }

    function obterVerticesValidos() {
        const linhas = corpoTabela.querySelectorAll("tr");
        const vertices = [];

        linhas.forEach(function (linha) {
            const x = parseFloat(linha.querySelector(".inputX").value);
            const y = parseFloat(linha.querySelector(".inputY").value);

            if (!isNaN(x) && !isNaN(y)) {
                vertices.push({ x: x, y: y });
            }
        });

        return vertices;
    }

    function redesenharPlanta() {
        const vertices = obterVerticesValidos();
        desenharPlanta(vertices);
    }

    document.getElementById("btnAdicionarVertice").addEventListener("click", adicionarLinhaVertice);

    adicionarLinhaVertice();
    adicionarLinhaVertice();
    adicionarLinhaVertice();

    document.getElementById("formTerreno").addEventListener("submit", function (e) {
        e.preventDefault();

        const vertices = obterVerticesValidos();

        if (vertices.length < 3) {
            alert("Preencha pelo menos 3 vértices.");
            return;
        }

        const area = calcularAreaPoligono(vertices);
        const perimetro = calcularPerimetroPoligono(vertices);

        document.getElementById("areaTotal").innerText = area.toFixed(2) + " m²";
        document.getElementById("perimetro").innerText = perimetro.toFixed(2) + " m";
        document.getElementById("totalVertices").innerText = vertices.length + " pontos";
    });
});

function calcularAreaPoligono(vertices) {
    let soma = 0;
    const total = vertices.length;

    for (let i = 0; i < total; i++) {
        const atual = vertices[i];
        const proximo = vertices[(i + 1) % total];
        soma += (atual.x * proximo.y) - (proximo.x * atual.y);
    }

    return Math.abs(soma) / 2;
}

function calcularPerimetroPoligono(vertices) {
    let soma = 0;
    const total = vertices.length;

    for (let i = 0; i < total; i++) {
        const atual = vertices[i];
        const proximo = vertices[(i + 1) % total];
        soma += Math.hypot(proximo.x - atual.x, proximo.y - atual.y);
    }

    return soma;
}

function desenharPlanta(vertices) {
    const svgNs = "http://www.w3.org/2000/svg";
    const svg = document.getElementById("plantaSvg");
    svg.innerHTML = "";

    const padding = 30;
    const svgWidth = 600;
    const svgHeight = 400;

    const xs = vertices.map(v => v.x).concat([0]);
    const ys = vertices.map(v => v.y).concat([0]);

    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    const larguraTerreno = (maxX - minX) || 1;
    const alturaTerreno = (maxY - minY) || 1;

    const escala = Math.min(
        (svgWidth - padding * 2) / larguraTerreno,
        (svgHeight - padding * 2) / alturaTerreno
    );

    const offsetX = (svgWidth - (larguraTerreno * escala)) / 2;
    const offsetY = (svgHeight - (alturaTerreno * escala)) / 2;

    function converterX(x) {
        return offsetX + ((x - minX) * escala);
    }

    function converterY(y) {
        return svgHeight - (offsetY + ((y - minY) * escala));
    }

    // eixo X
    const eixoX = document.createElementNS(svgNs, "line");
    eixoX.setAttribute("x1", 0);
    eixoX.setAttribute("y1", converterY(0));
    eixoX.setAttribute("x2", svgWidth);
    eixoX.setAttribute("y2", converterY(0));
    eixoX.setAttribute("class", "eixoReferencia");
    svg.appendChild(eixoX);

    // eixo Y
    const eixoY = document.createElementNS(svgNs, "line");
    eixoY.setAttribute("x1", converterX(0));
    eixoY.setAttribute("y1", 0);
    eixoY.setAttribute("x2", converterX(0));
    eixoY.setAttribute("y2", svgHeight);
    eixoY.setAttribute("class", "eixoReferencia");
    svg.appendChild(eixoY);

    const rotuloX = document.createElementNS(svgNs, "text");
    rotuloX.setAttribute("x", svgWidth - 15);
    rotuloX.setAttribute("y", converterY(0) - 6);
    rotuloX.setAttribute("class", "rotuloEixo");
    rotuloX.textContent = "X";
    svg.appendChild(rotuloX);

    const rotuloY = document.createElementNS(svgNs, "text");
    rotuloY.setAttribute("x", converterX(0) + 6);
    rotuloY.setAttribute("y", 15);
    rotuloY.setAttribute("class", "rotuloEixo");
    rotuloY.textContent = "Y";
    svg.appendChild(rotuloY);

    if (vertices.length >= 2) {
        const pontos = vertices.map(function (v) {
            return converterX(v.x) + "," + converterY(v.y);
        }).join(" ");

        const poligono = document.createElementNS(svgNs, "polygon");
        poligono.setAttribute("points", pontos);
        poligono.setAttribute("class", "terrenoPoligono");
        svg.appendChild(poligono);
    }
}