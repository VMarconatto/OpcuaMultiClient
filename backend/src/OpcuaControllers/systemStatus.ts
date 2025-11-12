/**
@LAST_EDIT : 2025-11-10
** =======================================================
*/
import os from "os";
// @ts-ignore — tipagem do pacote pode variar por versão
import osu from 'node-os-utils';


import { exec } from "child_process";
import { promisify } from "util";


// Desestrutura utilitários do node-os-utils
const { cpu, drive, mem, netstat } = osu;


/**
* Retorna um snapshot simples do estado do sistema.
*
* Campos retornados:
* - memoryUsage: Memória usada (MB) segundo `node-os-utils`.
* - diskUsage: Espaço em disco usado (GB) segundo `node-os-utils`.
* - uptime: Uptime do SO (segundos) via `os.uptime()`.
* - cpuLoad: Uso médio de CPU (%) segundo `node-os-utils`.
*
*  Somente comentários foram adicionados; a lógica foi mantida.
*/
export async function getSystemStatus() {
let memoryUsage = 0;
let diskUsage = 0;
let cpuLoad = 0;
let uptime = 0;


try {
const memory = await mem.info();
memoryUsage = Number(memory.usedMemMb);
} catch (err) {
console.error("Erro ao obter memória:", err);
}


try {
const disk = await drive.info();
diskUsage = Number(disk.usedGb);
} catch (err) {
console.error("Erro ao obter disco:", err);
}


try {
cpuLoad = await cpu.usage();
} catch (err) {
console.error("Erro ao obter CPU:", err);
}


try {
uptime = os.uptime();
} catch (err) {
console.error("Erro ao obter uptime:", err);
}


return {
memoryUsage,
diskUsage,
uptime,
cpuLoad,
};
}




// Promisifica exec para facilitar o uso com async/await
const execPromise = promisify(exec);


/**
* Mede a latência de rede executando um único ping para 8.8.8.8.
*
* Observações:
* - O comando atual usa o formato do Windows: `ping -n 1 8.8.8.8`.
* - Para Linux/Mac, comente a linha do Windows e descomente `ping -c 1 8.8.8.8`.
* - O parser aceita tanto `tempo=XXms` (pt-BR) quanto `time=XXms` (en-US).
*
* @returns {Promise<{ latencyMs: number | null }>} Objeto com a latência em ms ou null se falhar
*/
export async function getNetworkLatency(): Promise<{ latencyMs: number | null }> {
try {
// Faz ping para o Google com 1 pacote
const { stdout } = await execPromise("ping -n 1 8.8.8.8"); // Windows
// const { stdout } = await execPromise("ping -c 1 8.8.8.8"); // Linux/Mac


// Extrai o valor numérico da latência em ms (aceita "tempo" e "time")
const match = stdout.match(/tempo[=<]\s*(\d+)\s*ms/i) || stdout.match(/time[=<]\s*(\d+)\s*ms/i);
const latency = match ? parseInt(match[1], 10) : null;


return { latencyMs: latency };
} catch (err) {
console.error("Erro ao medir latência:", err);
return { latencyMs: null };
}
}