# NPML翻译器 项目文档
版本：v0.0.3
接收NPML代码，输出NPML翻译请求文。
基于deno+ts。

## 一、项目功能
### 1.1 文件按行读取
读取文件时，可读取指定行数范围的文件内容。如果行数范围省略，则读取全部内容。
### 1.2 文件内容类[废弃，不开发]
实现一个存储和管理已读取的文件内容类。
### 1.3 文件内容行号显示
给文件内容的每一行开头增加行号，例如：
```python
[1]def main():
[2]    print("Hello NPML!")
```
### 1.4 NPML引用内容读取
在NPML代码中（已经读取的文件内容）会有形如：
```text
!(docs/project.md)
!(../routes/login.tsx)
!(docs/libs/start.md#5)
!(docs/fresh/islands.md#12:36)
```
这样的引用内容语法标记。以感叹号开头，括号里面为引用内容文件地址（绝对或者相对）。文件地址后面#指明具体的行数范围。
#<from>:<to>表示读取第from行到第to行的引用内容。如果只有#<number>表示只读取第number行内容。
如果没有#则读取全部引用内容。
提取并读取NPML代码中所有引用内容。

### 1.5 指定目录结构树生成
指定某个存在的目录路径，遍历其中所有文件夹和文件，生成一个目录树，形如：
```text
docs/
    libs/
        fresh/
    project.md
routes/
    api/
    index.tsx
islands/
deno.json
main.ts
```
.开头的文件夹跳过遍历，如.git、.vscode、.venv等。
### 1.6 NPML翻译请求文生成（文件内容聚合）
NPML翻译请求文格式如下：
```text
NPML代码:
[正文]
项目结构说明:
[正文]
引用内容:
[正文1]
---
[正文2]
---
...
[NPML翻译提示词正文]
```
指定某个NPML代码文件路径后，读取文件，并标上行号；
读取NPML代码中的所有引用内容，也标上行号；
生成指定目录路径的目录树（如果没有指明目录路径，省略为空）；
在每个引用内容顶部加上：
```text
// docs/project.md
```
指明文件路径和文件名。多个引用内容之间用---隔开。
将上面内容按照NPML翻译请求文聚合整理为一个markdown文档。
最后的md文档有2种输出方式：
- 文件输出：在当前目录下输出该md文档，文件名为npml代码文件名；
- 剪切板输出：将md文档复制到剪切板上。

#### 1.6.1 NPML翻译提示词的获取
提示词先在本地缓存中寻找，如果没有则线上抓取同步到本地缓存中。
本地缓存地址为：
- linux：~/.local/share/npml/npml_prompt.md
- windows: C:Users/[当前用户名]/My Documents/npml/npml_prompt.md
- macos: [暂定]
线上抓取同步是通过读取指定github仓库的md文档实现，参考下面的示例代码：
```typescript
// getMd.ts
const OWNER = "denoland";
const REPO  = "manual";
const PATH  = "getting_started/installation.md"; // 文件在仓库中的路径
const BRANCH= "main";

const url = `https://raw.githubusercontent.com/${OWNER}/${REPO}/${BRANCH}/${PATH}`;

const res = await fetch(url);
if (!res.ok) throw new Error(await res.text());

const md = await res.text();
console.log(md);
```
线上地址url从[1.9 配置文件]中读取。
可主动同步提示词，加上指定参数。

### 1.7 CLI工具
实现2.1 项目架构中的CLI工具。
即将整个项目封装为CLI工具。
CLI工具名为npml，参数如下：
npml [npml_file_name]   :例如npml main.npml,在当前运行目录下生成npml翻译请求文的md文档。
npml -v                 :显示当前npml翻译器版本。
npml -h                 :显示参数使用说明。
npml -c                 :将npml翻译请求文复制到剪切板上，不生成md文档。
npml -t [dir_path]      :指明需要生成目录树的目录路径。
npml -dr                :不读取npml代码的引用内容。
npml -p                 :主动线上同步NPML提示词

### 1.8 剪切板操作
采用xsel实现，通过调用xsel CLI实现将内容复制到剪切板中。
这里的剪切板指ctrl+V和ctrl+C操作。
具体实现为：
    创建一个剪切板操作接口；
    采用xsel去定义类实现这个接口。
这样就可以保证不同系统、架构都统一API，自行具体实现。

### 1.9 配置文件
不同系统的配置文件地址不同：
- linux：~/.local/share/npml/config.json
- windows: C:Users/[当前用户名]/My Documents/npml/config.json
- macos: [暂定]
配置文件中存储[1.6.1 NPML翻译提示词的获取]的提示词线上地址url。

## 二、项目开发范式
单一职责原则；
关注点分离；
依赖注入风格；
模块化设计；
组合大于继承。