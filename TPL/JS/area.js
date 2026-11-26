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
            atualizarOpcoesLadoFrente();
            redesenharPlanta();
        });

        corpoTabela.appendChild(linha);
        atualizarOpcoesLadoFrente();
        redesenharPlanta();
    }

    function atualizarNumeracaoVertices() {
        const linhas = corpoTabela.querySelectorAll("tr");
        linhas.forEach(function (linha, indice) {
            linha.querySelector("td").innerText = "P" + (indice + 1);
        });
    }

    function atualizarOpcoesLadoFrente() {
        const total = corpoTabela.children.length;
        const select = document.getElementById("selectLadoFrente");
        const valorAnterior = select.value;
        select.innerHTML = "";

        for (let i = 0; i < total; i++) {
            const proximo = (i + 1) % total;
            const opcao = document.createElement("option");
            opcao.value = i;
            opcao.textContent = "Lado P" + (i + 1) + " → P" + (proximo + 1);
            select.appendChild(opcao);
        }

        if (valorAnterior !== "" && Number(valorAnterior) < total) {
            select.value = valorAnterior;
        }
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
        const angulo = parseFloat(document.getElementById("anguloNorte").value) || 0;
        desenharPlanta(vertices, null, null, angulo);
    }

    document.getElementById("btnAdicionarVertice").addEventListener("click", adicionarLinhaVertice);
    document.getElementById("anguloNorte").addEventListener("input", redesenharPlanta);

    adicionarLinhaVertice();
    adicionarLinhaVertice();
    adicionarLinhaVertice();

    document.getElementById("btnImportarCsv").addEventListener("click", function () {
        document.getElementById("inputArquivoCsv").click();
    });

    document.getElementById("inputArquivoCsv").addEventListener("change", function (e) {
        const arquivo = e.target.files[0];
        if (!arquivo) return;

        const leitor = new FileReader();
        leitor.onload = function (evento) {
            const linhas = evento.target.result.trim().split("\n");
            corpoTabela.innerHTML = "";

            linhas.forEach(function (linha) {
                const [x, y] = linha.split(",").map(valor => parseFloat(valor.trim()));
                adicionarLinhaVertice();
                const ultimaLinha = corpoTabela.lastElementChild;
                ultimaLinha.querySelector(".inputX").value = x;
                ultimaLinha.querySelector(".inputY").value = y;
            });

            atualizarOpcoesLadoFrente();
            redesenharPlanta();
        };
        leitor.readAsText(arquivo);
    });

    document.getElementById("formTerreno").addEventListener("submit", function (e) {
        e.preventDefault();

        const vertices = obterVerticesValidos();

        if (vertices.length < 3) {
            alert("Preencha pelo menos 3 vértices.");
            return;
        }

        if (!poligonoEhSimples(vertices)) {
            alert("Os lados do terreno não podem se cruzar. Confira a ordem dos vértices.");
            return;
        }

        const area = calcularAreaPoligono(vertices);
        const perimetro = calcularPerimetroPoligono(vertices);
        const angulo = parseFloat(document.getElementById("anguloNorte").value) || 0;

        const indiceFrente = parseInt(document.getElementById("selectLadoFrente").value, 10) || 0;
        const recuoFrontal = parseFloat(document.getElementById("recuoFrontal").value) || 0;
        const recuoLateralFundo = parseFloat(document.getElementById("recuoLateralFundo").value) || 0;
        const taxaOcupacao = parseFloat(document.getElementById("taxaOcupacao").value) || 0;

        const recuosPorAresta = vertices.map(function (_, indice) {
            return indice === indiceFrente ? recuoFrontal : recuoLateralFundo;
        });

        const temRecuo = recuoFrontal > 0 || recuoLateralFundo > 0;
        const verticesEnvelope = temRecuo ? calcularPoligonoRecuado(vertices, recuosPorAresta) : vertices;
        const areaEnvelope = calcularAreaPoligono(verticesEnvelope);
        const areaMaximaTO = area * (taxaOcupacao / 100);

        let verticesConstrucaoFinal = verticesEnvelope;
        if (taxaOcupacao > 0 && areaMaximaTO < areaEnvelope) {
            const fatorEscala = Math.sqrt(areaMaximaTO / areaEnvelope);
            verticesConstrucaoFinal = encolherPoligono(verticesEnvelope, fatorEscala);
        }

        const areaConstruivelFinal = calcularAreaPoligono(verticesConstrucaoFinal);

        desenharPlanta(vertices, temRecuo ? verticesEnvelope : null, verticesConstrucaoFinal, angulo);

        document.getElementById("areaTotal").innerText = area.toFixed(2) + " m²";
        document.getElementById("areaConstruivel").innerText = areaConstruivelFinal.toFixed(2) + " m²";
        document.getElementById("areaMaximaTO").innerText = areaMaximaTO.toFixed(2) + " m²";
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

function poligonoEhSimples(vertices) {
    const total = vertices.length;

    for (let i = 0; i < total; i++) {
        const a1 = vertices[i];
        const a2 = vertices[(i + 1) % total];

        for (let j = i + 1; j < total; j++) {
            const adjacente = (j === i + 1) || (i === 0 && j === total - 1);
            if (adjacente) continue;

            const b1 = vertices[j];
            const b2 = vertices[(j + 1) % total];

            if (segmentosSeCruzam(a1, a2, b1, b2)) return false;
        }
    }

    return true;
}

function segmentosSeCruzam(p1, p2, p3, p4) {
    function orientacao(a, b, c) {
        const valor = (b.y - a.y) * (c.x - b.x) - (b.x - a.x) * (c.y - b.y);
        if (valor === 0) return 0;
        return valor > 0 ? 1 : 2;
    }

    const o1 = orientacao(p1, p2, p3);
    const o2 = orientacao(p1, p2, p4);
    const o3 = orientacao(p3, p4, p1);
    const o4 = orientacao(p3, p4, p2);

    return (o1 !== o2 && o3 !== o4);
}

function calcularPoligonoRecuado(vertices, recuosPorAresta) {
    const total = vertices.length;
    const areaSinal = calcularAreaSinalPoligono(vertices);
    const sentido = areaSinal > 0 ? 1 : -1;

    const arestasDeslocadas = [];

    for (let i = 0; i < total; i++) {
        const p1 = vertices[i];
        const p2 = vertices[(i + 1) % total];
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const comprimento = Math.hypot(dx, dy);
        const recuo = recuosPorAresta[i];

        let nx = -dy / comprimento;
        let ny = dx / comprimento;
        if (sentido < 0) { nx = -nx; ny = -ny; }

        arestasDeslocadas.push({
            p1: { x: p1.x + nx * recuo, y: p1.y + ny * recuo },
            p2: { x: p2.x + nx * recuo, y: p2.y + ny * recuo }
        });
    }

    const novosVertices = [];
    for (let i = 0; i < total; i++) {
        const anterior = arestasDeslocadas[(i - 1 + total) % total];
        const atual = arestasDeslocadas[i];
        novosVertices.push(calcularIntersecaoRetas(anterior, atual));
    }

    return novosVertices;
}

function calcularAreaSinalPoligono(vertices) {
    let soma = 0;
    const total = vertices.length;
    for (let i = 0; i < total; i++) {
        const atual = vertices[i];
        const proximo = vertices[(i + 1) % total];
        soma += (atual.x * proximo.y) - (proximo.x * atual.y);
    }
    return soma / 2;
}

function calcularIntersecaoRetas(retaA, retaB) {
    const x1 = retaA.p1.x, y1 = retaA.p1.y, x2 = retaA.p2.x, y2 = retaA.p2.y;
    const x3 = retaB.p1.x, y3 = retaB.p1.y, x4 = retaB.p2.x, y4 = retaB.p2.y;

    const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
    if (denom === 0) return { x: x2, y: y2 };

    const px = ((x1 * y2 - y1 * x2) * (x3 - x4) - (x1 - x2) * (x3 * y4 - y3 * x4)) / denom;
    const py = ((x1 * y2 - y1 * x2) * (y3 - y4) - (y1 - y2) * (x3 * y4 - y3 * x4)) / denom;

    return { x: px, y: py };
}

function calcularCentroide(vertices) {
    let somaX = 0;
    let somaY = 0;

    vertices.forEach(function (v) {
        somaX += v.x;
        somaY += v.y;
    });

    return { x: somaX / vertices.length, y: somaY / vertices.length };
}

function encolherPoligono(vertices, fatorEscala) {
    const centro = calcularCentroide(vertices);

    return vertices.map(function (v) {
        return {
            x: centro.x + (v.x - centro.x) * fatorEscala,
            y: centro.y + (v.y - centro.y) * fatorEscala
        };
    });
}

function pontoDentroPoligono(ponto, poligono) {
    let dentro = false;

    for (let i = 0, j = poligono.length - 1; i < poligono.length; j = i++) {
        const xi = poligono[i].x, yi = poligono[i].y;
        const xj = poligono[j].x, yj = poligono[j].y;

        const intersecta = ((yi > ponto.y) !== (yj > ponto.y)) &&
            (ponto.x < (xj - xi) * (ponto.y - yi) / (yj - yi) + xi);

        if (intersecta) dentro = !dentro;
    }

    return dentro;
}

function calcularPassoRegua(intervalo) {
    const passosPossiveis = [0.5, 1, 2, 5, 10, 20, 50, 100];
    const alvoTicks = 8;
    const passoIdeal = intervalo / alvoTicks;

    for (const passo of passosPossiveis) {
        if (passo >= passoIdeal) return passo;
    }
    return passosPossiveis[passosPossiveis.length - 1];
}

function desenharReguaEixos(svg, svgNs, converterX, converterY, minX, maxX, minY, maxY) {
    const passoX = calcularPassoRegua(maxX - minX);
    const passoY = calcularPassoRegua(maxY - minY);

    const yEixo = converterY(0);
    for (let x = Math.ceil(minX / passoX) * passoX; x <= maxX; x += passoX) {
        const px = converterX(x);

        const tick = document.createElementNS(svgNs, "line");
        tick.setAttribute("x1", px);
        tick.setAttribute("y1", yEixo - 4);
        tick.setAttribute("x2", px);
        tick.setAttribute("y2", yEixo + 4);
        tick.setAttribute("class", "tickRegua");
        svg.appendChild(tick);

        const rotulo = document.createElementNS(svgNs, "text");
        rotulo.setAttribute("x", px);
        rotulo.setAttribute("y", yEixo + 16);
        rotulo.setAttribute("class", "rotuloRegua");
        rotulo.textContent = x.toFixed(0);
        svg.appendChild(rotulo);
    }

    const xEixo = converterX(0);
    for (let y = Math.ceil(minY / passoY) * passoY; y <= maxY; y += passoY) {
        const py = converterY(y);

        const tick = document.createElementNS(svgNs, "line");
        tick.setAttribute("x1", xEixo - 4);
        tick.setAttribute("y1", py);
        tick.setAttribute("x2", xEixo + 4);
        tick.setAttribute("y2", py);
        tick.setAttribute("class", "tickRegua");
        svg.appendChild(tick);

        const rotulo = document.createElementNS(svgNs, "text");
        rotulo.setAttribute("x", xEixo - 10);
        rotulo.setAttribute("y", py + 4);
        rotulo.setAttribute("class", "rotuloRegua");
        rotulo.setAttribute("text-anchor", "end");
        rotulo.textContent = y.toFixed(0);
        svg.appendChild(rotulo);
    }
}

function desenharBussola(svg, svgNs, anguloGraus) {
    const cx = 40;
    const cy = 40;
    const raio = 18;

    const grupo = document.createElementNS(svgNs, "g");
    grupo.setAttribute("transform", "rotate(" + anguloGraus + "," + cx + "," + cy + ")");

    const circulo = document.createElementNS(svgNs, "circle");
    circulo.setAttribute("cx", cx);
    circulo.setAttribute("cy", cy);
    circulo.setAttribute("r", raio);
    circulo.setAttribute("class", "bussolaCirculo");
    grupo.appendChild(circulo);

    const seta = document.createElementNS(svgNs, "line");
    seta.setAttribute("x1", cx);
    seta.setAttribute("y1", cy + raio - 4);
    seta.setAttribute("x2", cx);
    seta.setAttribute("y2", cy - raio + 4);
    seta.setAttribute("class", "bussolaSeta");
    grupo.appendChild(seta);

    const rotuloN = document.createElementNS(svgNs, "text");
    rotuloN.setAttribute("x", cx);
    rotuloN.setAttribute("y", cy - raio + 2);
    rotuloN.setAttribute("class", "bussolaRotulo");
    rotuloN.textContent = "N";
    grupo.appendChild(rotuloN);

    svg.appendChild(grupo);
}

function desenharPlanta(vertices, verticesEnvelope, verticesConstrucao, anguloNorte) {
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

    const eixoX = document.createElementNS(svgNs, "line");
    eixoX.setAttribute("x1", 0);
    eixoX.setAttribute("y1", converterY(0));
    eixoX.setAttribute("x2", svgWidth);
    eixoX.setAttribute("y2", converterY(0));
    eixoX.setAttribute("class", "eixoReferencia");
    svg.appendChild(eixoX);

    const eixoY = document.createElementNS(svgNs, "line");
    eixoY.setAttribute("x1", converterX(0));
    eixoY.setAttribute("y1", 0);
    eixoY.setAttribute("x2", converterX(0));
    eixoY.setAttribute("y2", svgHeight);
    eixoY.setAttribute("class", "eixoReferencia");
    svg.appendChild(eixoY);

    desenharReguaEixos(svg, svgNs, converterX, converterY, minX, maxX, minY, maxY);
    desenharBussola(svg, svgNs, anguloNorte || 0);

    const rotuloEixoX = document.createElementNS(svgNs, "text");
    rotuloEixoX.setAttribute("x", svgWidth - 15);
    rotuloEixoX.setAttribute("y", converterY(0) - 6);
    rotuloEixoX.setAttribute("class", "rotuloEixo");
    rotuloEixoX.textContent = "X";
    svg.appendChild(rotuloEixoX);

    const rotuloEixoY = document.createElementNS(svgNs, "text");
    rotuloEixoY.setAttribute("x", converterX(0) + 6);
    rotuloEixoY.setAttribute("y", 15);
    rotuloEixoY.setAttribute("class", "rotuloEixo");
    rotuloEixoY.textContent = "Y";
    svg.appendChild(rotuloEixoY);

    if (vertices.length >= 2) {
        const pontos = vertices.map(v => converterX(v.x) + "," + converterY(v.y)).join(" ");
        const poligono = document.createElementNS(svgNs, "polygon");
        poligono.setAttribute("points", pontos);
        poligono.setAttribute("class", "terrenoPoligono");
        svg.appendChild(poligono);
    }

    if (verticesEnvelope && verticesEnvelope.length >= 2) {
        const pontosEnvelope = verticesEnvelope.map(v => converterX(v.x) + "," + converterY(v.y)).join(" ");
        const envelope = document.createElementNS(svgNs, "polygon");
        envelope.setAttribute("points", pontosEnvelope);
        envelope.setAttribute("class", "envelopePoligono");
        svg.appendChild(envelope);
    }

    let construcao = null;
    if (verticesConstrucao && verticesConstrucao.length >= 2) {
        const pontosConstrucao = verticesConstrucao.map(v => converterX(v.x) + "," + converterY(v.y)).join(" ");
        construcao = document.createElementNS(svgNs, "polygon");
        construcao.setAttribute("points", pontosConstrucao);
        construcao.setAttribute("class", "construcaoPoligono");
        svg.appendChild(construcao);
    }

    if (construcao && verticesConstrucao) {
        const limite = (verticesEnvelope && verticesEnvelope.length >= 3) ? verticesEnvelope : vertices;
        let verticesAtuais = verticesConstrucao.map(v => ({ x: v.x, y: v.y }));
        let arrastando = false;
        let ultimoMouseX = 0;
        let ultimoMouseY = 0;

        function atualizarDesenhoConstrucao() {
            const pontos = verticesAtuais.map(v => converterX(v.x) + "," + converterY(v.y)).join(" ");
            construcao.setAttribute("points", pontos);
        }

        construcao.addEventListener("mousedown", function (evento) {
            arrastando = true;
            ultimoMouseX = evento.clientX;
            ultimoMouseY = evento.clientY;
            evento.preventDefault();
        });

        document.addEventListener("mousemove", function (evento) {
            if (!arrastando) return;

            const retanguloSvg = svg.getBoundingClientRect();
            const escalaTela = svgWidth / retanguloSvg.width;

            const deltaPixelX = (evento.clientX - ultimoMouseX) * escalaTela;
            const deltaPixelY = (evento.clientY - ultimoMouseY) * escalaTela;

            const deltaX = deltaPixelX / escala;
            const deltaY = -deltaPixelY / escala;

            const tentativa = verticesAtuais.map(v => ({ x: v.x + deltaX, y: v.y + deltaY }));
            const todosDentro = tentativa.every(v => pontoDentroPoligono(v, limite));

            if (todosDentro) {
                verticesAtuais = tentativa;
                atualizarDesenhoConstrucao();
            }

            ultimoMouseX = evento.clientX;
            ultimoMouseY = evento.clientY;
        });

        document.addEventListener("mouseup", function () {
            arrastando = false;
        });
    }

    if (vertices.length === 0) return;

    const centroX = vertices.reduce((soma, v) => soma + converterX(v.x), 0) / vertices.length;
    const centroY = vertices.reduce((soma, v) => soma + converterY(v.y), 0) / vertices.length;

    vertices.forEach(function (v, indice) {
        const px = converterX(v.x);
        const py = converterY(v.y);

        const dirX = px - centroX;
        const dirY = py - centroY;
        const distancia = Math.hypot(dirX, dirY) || 1;
        const distanciaRotulo = 18;

        const rotuloX = px + (dirX / distancia) * distanciaRotulo;
        const rotuloY = py + (dirY / distancia) * distanciaRotulo;

        const circulo = document.createElementNS(svgNs, "circle");
        circulo.setAttribute("cx", px);
        circulo.setAttribute("cy", py);
        circulo.setAttribute("r", 4);