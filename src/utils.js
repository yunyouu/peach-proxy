export function log(...args) {
  // 获取当前时间戳
  const timestamp = new Date().toISOString();

  // 处理 Record 对象
  const formattedArgs = args.map(arg => {
    if (typeof arg === 'object' && arg !== null && !Array.isArray(arg)) {
      return JSON.stringify(arg, null, 2); // 格式化对象以便更易读
    }
    return arg;
  });

  console.log(`[${timestamp}]`, ...formattedArgs);
}

export default null