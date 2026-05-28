LVM 逻辑卷完整操作手册
===

**LVM（Logical Volume Manager，逻辑卷管理器）**​ 是 Linux 下高级的**磁盘存储虚拟化机制**，允许将多块物理磁盘/分区组合成存储池，动态创建、扩容、缩减、快照逻辑卷。它是生产环境数据库、Web 服务器、云平台推荐的存储管理方式。

> ⚠️ **注意**：尽管 LVM 提供灵活性，但涉及 `vgreduce --removemissing`、`lvremove`、`pvremove`等命令仍具破坏性，操作前请确认并备份重要数据。

* * *

补充说明
----

LVM 在 Linux 存储栈中的位置：
    物理磁盘/分区(PV) → 卷组(VG) → 逻辑卷(LV) → 文件系统(ext4/xfs)

### LVM 三大核心概念

| 概念      | 全称              | 说明                                     |
| ------- | --------------- | -------------------------------------- |
| **PV**​ | Physical Volume | 物理卷，通常是磁盘分区（如 /dev/sdb1）经 pvcreate 初始化 |
| **VG**​ | Volume Group    | 卷组，由一个或多个 PV 组成的存储池                    |
| **LV**​ | Logical Volume  | 逻辑卷，从 VG 中划分出来，相当于"虚拟分区"，可格式化挂载        |

### 为什么用 LVM？

* ✅ 在线扩容/缩减（无需重新分区磁盘）

* ✅ 跨多块物理磁盘组成一个大存储空间

* ✅ 支持快照（Snapshot）

* ✅ 灵活迁移（pvmove）

* * *

语法
--

    # 物理卷
    pvcreate [设备...]
    pvdisplay
    pvs
    
    # 卷组
    vgcreate <VG名> <PV...>
    vgextend <VG名> <PV...>
    vgdisplay
    vgs
    
    # 逻辑卷
    lvcreate -L <大小> -n <LV名> <VG名>
    lvextend -L +<大小> /dev/<VG>/<LV>
    lvreduce -L <大小> /dev/<VG>/<LV>
    lvdisplay
    lvs

* * *

选项（常用）
------

### pvcreate

    pvcreate /dev/sdb1 /dev/sdc1   初始化物理卷

### vgcreate

    vgcreate vgdata /dev/sdb1      创建名为 vgdata 的卷组

### lvcreate

    -l 100%FREE    使用 VG 中所有剩余空间
    -L 50G         指定固定大小
    -n lvdata      指定 LV 名称

### lvextend

    -l +100%FREE   把 VG 剩余空间全部分配给 LV
    -r             自动同步文件系统（较新版本支持）

* * *

参数
--

| 参数                   | 说明             |
| -------------------- | -------------- |
| `/dev/sdb1`          | 作为 PV 使用的分区或整盘 |
| `vgdata`             | 卷组名称（自定义）      |
| `lvdata`             | 逻辑卷名称（自定义）     |
| `/dev/vgdata/lvdata` | LV 设备路径        |
| `ext4`/ `xfs`        | 文件系统类型         |

* * *

完整操作流程
------

* * *

一、准备物理分区（PV 来源）
---------------

> 如已有整块空闲磁盘也可直接用（不推荐跳过分区表）

    # 查看磁盘
    lsblk
    fdisk -l
    
    # 示例：对 /dev/sdb 新建一个 Linux LVM 分区
    fdisk /dev/sdb

交互流程：

```
n       新建分区
p       主分区
1       分区号
回车     起始
回车     结束
t       修改类型
8e      Linux LVM（或 31 → Linux LVM for GPT）
w       保存
```

通知内核：

```
partprobe /dev/sdb
```

* * *

二、创建 PV（Physical Volume）
------------------------

    pvcreate /dev/sdb1
    pvdisplay
    pvs

✅ 成功后可看到 `/dev/sdb1`已被标记为 LVM PV

* * *

三、创建 VG（Volume Group）
---------------------

    vgcreate vgdata /dev/sdb1
    vgdisplay
    vgs

> 如需扩展 VG（加第二块盘）：

    pvcreate /dev/sdc1
    vgextend vgdata /dev/sdc1

* * *

四、创建 LV（Logical Volume）
-----------------------

    # 创建 50G 的逻辑卷
    lvcreate -L 50G -n lvdata vgdata
    
    # 或使用 VG 全部剩余空间
    lvcreate -l 100%FREE -n lvdata vgdata
    
    lvdisplay
    lvs

设备路径通常为：

```
/dev/vgdata/lvdata
/dev/mapper/vgdata-lvdata
```

* * *

五、格式化 LV 并挂载
------------

### 格式化为 ext4

    mkfs.ext4 /dev/vgdata/lvdata
    mkdir /data
    mount /dev/vgdata/lvdata /data

### 或格式化为 XFS（常见于 CentOS/RHEL 7+）

    mkfs.xfs /dev/vgdata/lvdata
    mount /dev/vgdata/lvdata /data

### 写入 /etc/fstab（建议用 UUID）

    blkid /dev/vgdata/lvdata
    vim /etc/fstab

ext4 示例：

```
UUID=xxxx-xxxx /data ext4 defaults 0 2
```

XFS 示例：

```
UUID=xxxx-xxxx /data xfs defaults 0 2
```

验证：

```
mount -a 
df -h
```

* * *

六、LV 在线扩容（最常用）
--------------

### ✅ Ext4 扩容步骤

    # 1. 扩展 LV（增加 20G）
    lvextend -L +20G /dev/vgdata/lvdata
    
    # 或把 VG 剩余空间全部分配
    lvextend -l +100%FREE /dev/vgdata/lvdata
    
    # 2. 同步文件系统
    resize2fs /dev/vgdata/lvdata

### ✅ XFS 扩容步骤（XFS 只支持扩容）

    lvextend -L +20G /dev/vgdata/lvdata
    xfs_growfs /data      # 注意：挂载点，不是设备

> 💡 新版 `lvextend`支持 `-r`自动同步文件系统：

    lvextend -r -L +20G /dev/vgdata/lvdata

* * *

七、LV 缩减（仅 Ext4 支持，⚠️高风险）
------------------------

> ❌ **XFS 不支持缩减！**

### 步骤（必须 umount）

    umount /data
    e2fsck -f /dev/vgdata/lvdata
    
    # 先缩小文件系统
    resize2fs /dev/vgdata/lvdata 30G
    
    # 再缩小 LV
    lvreduce -L 30G /dev/vgdata/lvdata
    
    mount /dev/vgdata/lvdata /data

⚠️ **LV 尺寸不得小于文件系统已缩小的尺寸！**

* * *

八、LVM 快照（Snapshot）
------------------

### 创建快照（需 VG 中有足够空闲空间）

    lvcreate -L 5G -s -n lvdata_snap /dev/vgdata/lvdata

### 挂载快照查看

    mkdir /mnt/snap
    mount -o ro /dev/vgdata/lvdata_snap /mnt/snap

### 删除快照

    lvremove /dev/vgdata/lvdata_snap

* * *

九、VG 扩容 / PV 移除 / LV 迁移
-----------------------

### 添加新 PV 到 VG

    pvcreate /dev/sdd1
    vgextend vgdata /dev/sdd1

### 将数据从某 PV 移走（磁盘更换）

    pvmove /dev/sdb1
    vgreduce vgdata /dev/sdb1
    pvremove /dev/sdb1

* * *

十、关键注意事项（必读）
------------

| 项目        | 说明                               |
| --------- | -------------------------------- |
| XFS 不能缩减  | 只能扩容，设计如此                        |
| 快照空间耗尽    | 快照会 invalid，需预估写入量               |
| VG 空间不足   | lvextend 会失败，先 vgextend          |
| boot 分区   | **不建议 /boot 使用 LVM**（GRUB 可能不识别） |
| 备份 fstab  | 错误 fstab 导致系统无法启动                |
| pvmove 耗时 | 大磁盘迁移 I/O 较重                     |

* * *

十一、常用排错命令
---------

    lsblk                      # 查看块设备拓扑
    blkid                      # 查看 UUID
    pvscan ; vgscan ; lvscan   # 重新扫描 LVM 结构
    dmsetup ls                 # 查看 Device Mapper

* * *

十二、操作总览图
--------

    ┌───────────┐
    │ 物理磁盘  │  /dev/sdb1, /dev/sdc1
    └─────┬─────┘
          ↓ pvcreate
    ┌───────────┐
    │    PV     │
    └─────┬─────┘
          ↓ vgcreate / vgextend
    ┌───────────┐
    │    VG     │  存储池 (vgdata)
    └─────┬─────┘
          ↓ lvcreate / lvextend
    ┌───────────┐
    │    LV     │  /dev/vgdata/lvdata
    └─────┬─────┘
          ↓ mkfs
    ┌───────────┐
    │ Filesystem│  ext4 / xfs
    └─────┬─────┘
          ↓ mount
        /data


