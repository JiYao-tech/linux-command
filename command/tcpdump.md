tcpdump
=========================

> **tcpdump**​ 是 Linux / Unix 下最常用的命令行网络抓包分析工具，可基于网卡、端口、IP、协议等进行过滤。

* * *

基本语法
------

    tcpdump [选项] [过滤表达式]

通常需要 **root 权限**：
    sudo tcpdump ...

* * *

常用选项（Options）
---------------

| 选项                | 说明                               |
| ----------------- | -------------------------------- |
| `-i <网卡>`         | 指定网卡，如 `-i eth0`，`-i any`表示所有网卡  |
| `-n`              | 不解析主机名（不做 DNS 反向解析，加快显示）         |
| `-nn`             | 不解析主机名 + 不解析端口服务名（显示纯 IP/端口）     |
| `-v / -vv / -vvv` | 显示更详细的信息                         |
| `-c <N>`          | 抓取 N 个包后停止                       |
| `-w <文件.pcap>`    | 保存原始数据包到文件（可用 Wireshark 分析）      |
| `-r <文件.pcap>`    | 读取已保存的抓包文件                       |
| `-X`              | 同时显示十六进制和 ASCII                  |
| `-XX`             | 包含链路层头信息                         |
| `-e`              | 显示链路层（MAC）头                      |
| `-t`              | 不显示时间戳                           |
| `-tttt`           | 显示可读的标准时间戳                       |
| `-s <len>`        | 每个包抓取前 len 字节（默认可能截断，`-s 0`抓完整包） |
| `-C <MB>`         | 与 `-w`配合，达到指定大小后自动切文件            |
| `-G <秒>`          | 按时间轮转保存                          |

示例：
    sudo tcpdump -i any -nn -s 0 -w capture.pcap

* * *

过滤表达式（Filter / BPF）
---------------------

tcpdump 使用 **BPF（Berkeley Packet Filter）**​ 语法。

### 1️⃣ 指定网卡 / IP / 端口

| 表达式                   | 说明                     |
| --------------------- | ---------------------- |
| `host 192.168.1.10`   | 源或目的 IP 为 192.168.1.10 |
| `src host 10.0.0.1`   | 源 IP                   |
| `dst host 10.0.0.1`   | 目的 IP                  |
| `net 192.168.1.0/24`  | 某网段                    |
| `port 80`             | 源或目的端口 80              |
| `src port 22`         | 源端口                    |
| `dst port 443`        | 目的端口                   |
| `portrange 8000-8080` | 端口范围                   |

* * *

### 2️⃣ 指定协议

| 表达式    | 说明     |
| ------ | ------ |
| `tcp`  | TCP 包  |
| `udp`  | UDP 包  |
| `icmp` | ICMP 包 |
| `arp`  | ARP 包  |
| `ip`   | IPv4   |
| `ip6`  | IPv6   |

示例：
    tcpdump tcp and port 80

* * *

### 3️⃣ 逻辑运算符

| 符号          | 含义  |
| ----------- | --- |
| `and`/ `&&` | 与   |
| `or`/ `     |     |
| `not`/ `!`  | 非   |

示例：
    tcpdump 'host 192.168.1.10 and (port 80 or port 443)'
    tcpdump 'tcp and not port 22'

⚠️ **注意**：含 `()`、`|`、`!`时建议用 **单引号包裹**，避免 shell 解析错误。

* * *

### 4️⃣ 常见高级过滤

| 表达式                                                             | 说明             |
| --------------------------------------------------------------- | -------------- |
| `tcp[tcpflags] & (tcp-syn                                       | tcp-ack) != 0` |
| `tcp[tcpflags] & tcp-syn != 0 and tcp[tcpflags] & tcp-ack == 0` | 仅 SYN（三次握手首包）  |
| `icmp`                                                          | ping 包         |
| `ether host xx:xx:xx:xx:xx:xx`                                  | 指定 MAC 地址      |

* * *

常用实战示例
--------

### 🔹 1. 查看所有网卡流量（推荐基础用法）

    sudo tcpdump -i any -nn

### 🔹 2. 抓指定 IP 的所有流量

    sudo tcpdump -i eth0 -nn host 192.168.1.100

### 🔹 3. 抓某 IP 的 80 端口（HTTP）

    sudo tcpdump -i any -nn 'host 192.168.1.100 and port 80'

### 🔹 4. 抓 TCP 三次握手（SYN / SYN-ACK）

    sudo tcpdump -i any -nn 'tcp[tcpflags] & tcp-syn != 0'

### 🔹 5. 抓 DNS（UDP 53）

    sudo tcpdump -i any -nn -v udp port 53

### 🔹 6. 抓 SSH（22）但不看自己连接

    sudo tcpdump -i eth0 -nn 'port 22 and not host 127.0.0.1'

### 🔹 7. 保存抓包供 Wireshark 分析（最常用）

    sudo tcpdump -i any -nn -s 0 -c 10000 -w capture.pcap

### 🔹 8. 读取已保存的 pcap 文件

    tcpdump -nn -r capture.pcap
    tcpdump -nn -r capture.pcap 'tcp port 80'

### 🔹 9. 显示 ASCII 内容（如 HTTP 明文调试）

    sudo tcpdump -i any -Ann -s 0 'port 80'

> `-A`以 ASCII 显示（部分版本需 `tcpdump -A`）

* * *

使用建议 & 注意事项
-------------

✅ 生产环境 **尽量加 `-c`或 `-w`+ 限制大小**，避免长时间抓包打满磁盘

✅ 分析复杂协议推荐：`tcpdump -w xxx.pcap`→ **Wireshark 打开**​

✅ 高流量服务器慎用 `-v`/ `-X`，会影响性能

✅ 容器 / 云环境注意网卡名称（如 `eth0`, `ens3`, `any`）

* * *

如果你需要：

* ✅ **Wireshark vs tcpdump 对比**

* ✅ **HTTP / HTTPS / MySQL / Redis 专项抓包示例**

* ✅ **k8s / docker 容器内容器抓包方式**

可以直接告诉我 👍
