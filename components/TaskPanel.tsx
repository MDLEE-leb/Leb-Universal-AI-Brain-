import React, { useState, useEffect, useMemo } from 'react';
import { Task, TaskPriority } from '../types';
import { TaskIcon, TrashIcon, SortAscendingIcon, SortDescendingIcon } from './icons';

const TASKS_STORAGE_KEY = 'aiBrainTasks';

const getInitialTasks = (): Task[] => {
    try {
        const storedTasks = localStorage.getItem(TASKS_STORAGE_KEY);
        if (storedTasks) {
            return JSON.parse(storedTasks);
        }
    } catch (error) {
        console.error("Failed to parse tasks from localStorage", error);
        localStorage.removeItem(TASKS_STORAGE_KEY);
    }
    return [];
};

const priorityMap: { [key in TaskPriority]: number } = {
    'High': 3,
    'Medium': 2,
    'Low': 1,
};

const priorityColors: { [key in TaskPriority]: string } = {
    'High': 'bg-red-500/80 border-red-400',
    'Medium': 'bg-yellow-500/80 border-yellow-400',
    'Low': 'bg-sky-500/80 border-sky-400',
};

const TaskPanel: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>(getInitialTasks);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDueDate, setNewTaskDueDate] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState<TaskPriority>('Medium');
  const [sortCriteria, setSortCriteria] = useState('creationDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  useEffect(() => {
    try {
        localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
    } catch (error) {
        console.error("Failed to save tasks to localStorage", error);
    }
  }, [tasks]);

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    const newTask: Task = {
        id: new Date().toISOString(),
        title: newTaskTitle.trim(),
        priority: newTaskPriority,
        dueDate: newTaskDueDate || null,
        creationDate: new Date().toISOString(),
        completed: false,
    };
    setTasks(prevTasks => [...prevTasks, newTask]);
    setNewTaskTitle('');
    setNewTaskDueDate('');
    setNewTaskPriority('Medium');
  };

  const handleToggleComplete = (taskId: string) => {
    setTasks(tasks.map(task => 
        task.id === taskId ? { ...task, completed: !task.completed } : task
    ));
  };

  const handleDeleteTask = (taskId: string) => {
    setTasks(tasks.filter(task => task.id !== taskId));
  };
  
  const handleToggleSortOrder = () => {
    setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
  };

  const sortedTasks = useMemo(() => {
    return [...tasks].sort((a, b) => {
        let comparison = 0;
        switch (sortCriteria) {
            case 'dueDate':
                if (a.dueDate && b.dueDate) comparison = new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
                else if (a.dueDate) comparison = -1;
                else if (b.dueDate) comparison = 1;
                break;
            case 'priority':
                comparison = priorityMap[b.priority] - priorityMap[a.priority];
                break;
            case 'alphabetical':
                comparison = a.title.localeCompare(b.title);
                break;
            case 'creationDate':
                comparison = new Date(a.creationDate).getTime() - new Date(b.creationDate).getTime();
                break;
        }
        return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [tasks, sortCriteria, sortOrder]);


  return (
    <div className="flex flex-col h-full bg-gray-800">
      <header className="p-4 border-b border-gray-700/50">
        <h2 className="text-2xl font-bold text-white">Task Brain</h2>
      </header>
      
      <div className="p-4">
        <form onSubmit={handleAddTask} className="bg-gray-900/50 p-4 rounded-lg border border-gray-700 flex flex-wrap items-end gap-4">
            <div className="flex-grow min-w-[200px]">
                <label htmlFor="task-title" className="block text-sm font-medium text-gray-400 mb-1">Task Title</label>
                <input id="task-title" type="text" value={newTaskTitle} onChange={e => setNewTaskTitle(e.target.value)} placeholder="e.g., Deploy the new feature" className="w-full bg-gray-700 rounded-md p-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
            </div>
            <div>
                <label htmlFor="task-duedate" className="block text-sm font-medium text-gray-400 mb-1">Due Date</label>
                <input id="task-duedate" type="date" value={newTaskDueDate} onChange={e => setNewTaskDueDate(e.target.value)} className="w-full bg-gray-700 rounded-md p-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
            </div>
            <div>
                <label htmlFor="task-priority" className="block text-sm font-medium text-gray-400 mb-1">Priority</label>
                <select id="task-priority" value={newTaskPriority} onChange={e => setNewTaskPriority(e.target.value as TaskPriority)} className="w-full bg-gray-700 rounded-md p-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                    <option>Low</option>
                    <option>Medium</option>
                    <option>High</option>
                </select>
            </div>
            <button type="submit" className="px-4 py-2 rounded-md bg-indigo-600 text-white font-semibold hover:bg-indigo-500 transition-colors">Add Task</button>
        </form>
      </div>

      <div className="px-4 pb-2 flex items-center justify-end gap-4">
          <label htmlFor="sort-criteria" className="text-sm font-medium text-gray-400">Sort by:</label>
          <select id="sort-criteria" value={sortCriteria} onChange={e => setSortCriteria(e.target.value)} className="bg-gray-700 rounded-md p-2 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="creationDate">Creation Date</option>
            <option value="dueDate">Due Date</option>
            <option value="priority">Priority</option>
            <option value="alphabetical">Alphabetical</option>
          </select>
          <button onClick={handleToggleSortOrder} className="p-2 rounded-full text-gray-400 hover:bg-gray-700 hover:text-white transition-colors" aria-label="Toggle sort order">
            {sortOrder === 'asc' ? <SortAscendingIcon className="w-5 h-5" /> : <SortDescendingIcon className="w-5 h-5" />}
          </button>
      </div>

      <div className="flex-1 p-4 overflow-y-auto">
        {sortedTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <TaskIcon className="w-24 h-24 mb-4" />
            <p>No tasks yet. Add one above to get started!</p>
          </div>
        ) : (
          <ul className="space-y-3">
            {sortedTasks.map(task => (
                <li key={task.id} className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${task.completed ? 'bg-gray-900/50 border-gray-700' : 'bg-gray-700/50 border-gray-600'}`}>
                    <input type="checkbox" checked={task.completed} onChange={() => handleToggleComplete(task.id)} className="w-5 h-5 rounded bg-gray-600 border-gray-500 text-indigo-500 focus:ring-indigo-600 cursor-pointer"/>
                    <div className="flex-grow">
                        <p className={`text-white ${task.completed ? 'line-through text-gray-500' : ''}`}>{task.title}</p>
                        {task.dueDate && <p className={`text-xs mt-1 ${task.completed ? 'text-gray-600' : 'text-gray-400'}`}>Due: {new Date(task.dueDate).toLocaleDateString()}</p>}
                    </div>
                    <div className={`px-2 py-1 text-xs font-semibold text-white rounded-full border ${priorityColors[task.priority]}`}>{task.priority}</div>
                    <button onClick={() => handleDeleteTask(task.id)} className="p-2 rounded-full text-gray-400 hover:bg-red-500/20 hover:text-red-400 transition-colors" aria-label="Delete task">
                        <TrashIcon className="w-5 h-5" />
                    </button>
                </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default TaskPanel;