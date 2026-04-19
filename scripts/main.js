// API 基础地址
const API_BASE = 'https://api.yangyus8.top/api';

// 页面加载完成后执行
document.addEventListener('DOMContentLoaded', () => {
  // 获取所有 DOM 元素
  const loadTasksBtn = document.getElementById('loadTasksBtn');
  const taskForm = document.getElementById('taskForm');
  const statusFilter = document.getElementById('statusFilter');
  const taskList = document.getElementById('taskList');
  const formMessage = document.getElementById('formMessage');
  const listMessage = document.getElementById('listMessage');

  // 存储所有任务数据（用于筛选）
  let allTasks = [];

  // 1. 页面加载 → 请求任务列表（GET）
  fetchTasks();

  // 2. 点击“刷新任务”按钮 → 重新获取列表
  loadTasksBtn.addEventListener('click', fetchTasks);

  // 3. 根据下拉框筛选任务
  statusFilter.addEventListener('change', renderFilteredTasks);

  // 4. 提交表单 → 新增任务（POST）
  taskForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData(taskForm);
    const taskData = {
      title: formData.get('title').trim(),
      owner: formData.get('owner').trim(),
      status: formData.get('status')
    };

    // 输入验证
    if (!taskData.title || !taskData.owner) {
      formMessage.textContent = '请填写任务名称和负责人';
      formMessage.style.color = '#dc2626';
      return;
    }

    try {
      // 禁用按钮避免重复提交
      taskForm.querySelector('button[type="submit"]').disabled = true;
      loadTasksBtn.disabled = true;
      
      // 5. 向 API 新增任务（POST）
      const res = await fetch(`${API_BASE}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData)
      });

      const result = await res.json();
      if (result.success) {
        formMessage.textContent = '任务提交成功！';
        formMessage.style.color = '#166534';
        taskForm.reset();
        fetchTasks(); // 提交成功后刷新列表
      } else {
        formMessage.textContent = result.message || '提交失败';
        formMessage.style.color = '#dc2626';
      }
    } catch (err) {
      formMessage.textContent = '网络异常，提交失败';
      formMessage.style.color = '#dc2626';
    } finally {
      // 恢复按钮状态
      taskForm.querySelector('button[type="submit"]').disabled = false;
      loadTasksBtn.disabled = false;
    }

    // 3秒后清空提示
    setTimeout(() => formMessage.textContent = '', 3000);
  });

  // =============== 核心函数 ===============

  // 1. 请求任务列表（GET）
  async function fetchTasks() {
    try {
      loadTasksBtn.disabled = true;
      listMessage.textContent = '加载中...';
      listMessage.style.color = '';
      taskList.innerHTML = '';

      const res = await fetch(`${API_BASE}/tasks`);
      
      // 检查HTTP响应状态
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      
      const result = await res.json();

      if (result.success) {
        // 5. 把接口返回的数据渲染到页面上
        allTasks = Array.isArray(result.data) ? result.data : [];
        renderFilteredTasks();
        listMessage.textContent = allTasks.length > 0 
          ? `共 ${allTasks.length} 个任务` 
          : '暂无任务数据';
        listMessage.style.color = '';
      } else {
        listMessage.textContent = '获取任务失败：' + (result.message || '未知错误');
        listMessage.style.color = '#dc2626';
      }
    } catch (err) {
      console.error('Fetch error:', err);
      listMessage.textContent = '网络请求失败，请检查接口';
      listMessage.style.color = '#dc2626';
    } finally {
      loadTasksBtn.disabled = false;
    }
  }

  // 4. 根据下拉框筛选任务
  function renderFilteredTasks() {
    const filterValue = statusFilter.value;
    let filteredTasks = allTasks;

    if (filterValue !== 'all') {
      filteredTasks = allTasks.filter(task => task.status === filterValue);
    }

    // 5. 把接口返回的数据渲染到页面上
    renderTasks(filteredTasks);
  }

  // 5. 把接口返回的数据渲染到页面上
  function renderTasks(tasks) {
    if (tasks.length === 0) {
      taskList.innerHTML = '<li class="task-item"><p>暂无任务数据</p></li>';
      return;
    }

    taskList.innerHTML = tasks.map(task => `
      <li class="task-item">
        <h3>${escapeHtml(task.title)}</h3>
        <div class="task-meta">
          <span>负责人：${escapeHtml(task.owner)}</span>
          <span class="badge ${task.status}">${getStatusText(task.status)}</span>
        </div>
      </li>
    `).join('');
  }

  // 状态文字转换
  function getStatusText(status) {
    switch (status) {
      case 'todo': return '待开始';
      case 'doing': return '进行中';
      case 'done': return '已完成';
      default: return status;
    }
  }

  // 防止XSS攻击的HTML转义函数
  function escapeHtml(text) {
    if (typeof text !== 'string') return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
});