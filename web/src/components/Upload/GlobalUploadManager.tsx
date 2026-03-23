import React from 'react';
import { useAtom, useAtomValue } from 'jotai';
import { Progress, Button, Typography, Space, Tooltip } from 'antd';
import { CloseOutlined, MinusOutlined, CheckCircleOutlined, SyncOutlined, LoadingOutlined, ExclamationCircleOutlined, UpOutlined, VideoCameraOutlined, AudioOutlined, FileOutlined } from '@ant-design/icons';
import { uploadQueueAtom, isUploadWindowMinimizedAtom, isUploadWindowVisibleAtom, hasActiveUploadsAtom } from '@web/src/store/upload.store';

const { Text } = Typography;

export const GlobalUploadManager: React.FC = () => {
    const [queue, setQueue] = useAtom(uploadQueueAtom);
    const [isMinimized, setIsMinimized] = useAtom(isUploadWindowMinimizedAtom);
    const [isVisible, setIsVisible] = useAtom(isUploadWindowVisibleAtom);
    const hasActiveUploads = useAtomValue(hasActiveUploadsAtom);

    if (!isVisible && queue.length === 0) return null;

    const handleClose = () => {
        setIsVisible(false);
        setQueue(q => q.filter(t => t.status === 'uploading' || t.status === 'pending' || t.status === 'processing'));
    };

    return (
        <div className={`fixed bottom-4 right-4 z-[99] transition-all duration-300 ${isMinimized ? 'w-64' : 'w-80'} shadow-xl rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col`}>
             {/* Header */}
             <div 
                 className="flex justify-between items-center px-4 py-3 cursor-pointer bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700"
                 onClick={() => setIsMinimized(!isMinimized)}
             >
                 <Text strong>{hasActiveUploads ? `Uploading ${queue.filter(t => t.status === 'uploading' || t.status === 'pending' || t.status === 'processing').length} files...` : 'Uploads Complete'}</Text>
                 <Space size="small">
                     <Button 
                         type="text" 
                         size="small" 
                         icon={isMinimized ? <UpOutlined /> : <MinusOutlined />} 
                         onClick={(e) => { e.stopPropagation(); setIsMinimized(!isMinimized) }} 
                     />
                     {!hasActiveUploads && (
                         <Button 
                             type="text" 
                             size="small" 
                             icon={<CloseOutlined />} 
                             onClick={(e) => { e.stopPropagation(); handleClose(); }} 
                         />
                     )}
                 </Space>
             </div>

             {/* Content */}
             {!isMinimized && (
                 <div className="max-h-80 overflow-y-auto p-2 bg-white dark:bg-gray-800">
                     {queue.map(task => (
                         <div key={task.id} className="mb-2 p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
                             <div className="flex justify-between items-center mb-1">
                                 <div className="flex items-center gap-2 overflow-hidden pr-2">
                                     {task.type === 'video' ? <VideoCameraOutlined className="text-gray-500 flex-shrink-0" /> : task.type === 'audio' ? <AudioOutlined className="text-gray-500 flex-shrink-0" /> : <FileOutlined className="text-gray-500 flex-shrink-0" />}
                                     <Text ellipsis className="text-sm font-medium" style={{ display: 'block', maxWidth: '200px' }} title={task.originalName}>
                                         {task.originalName}
                                     </Text>
                                 </div>
                                 <div className="flex-shrink-0 flex items-center gap-1">
                                     {task.status === 'completed' && <CheckCircleOutlined className="text-green-500" />}
                                     {(task.status === 'uploading' || task.status === 'pending') && (
                                         <>
                                             <LoadingOutlined className="text-blue-500" />
                                             <Tooltip title="Cancel Upload">
                                                 <Button 
                                                     type="text" 
                                                     size="small" 
                                                     danger 
                                                     icon={<CloseOutlined style={{ fontSize: '10px' }} />} 
                                                     className="w-5 h-5 min-w-0 p-0 flex items-center justify-center ml-1 bg-red-50 hover:bg-red-100"
                                                     onClick={(e) => {
                                                         e.stopPropagation();
                                                         if (task.xhr) {
                                                             task.xhr.abort();
                                                         }
                                                         setQueue(q => q.filter(t => t.id !== task.id));
                                                     }}
                                                 />
                                             </Tooltip>
                                         </>
                                     )}
                                     {task.status === 'processing' && <SyncOutlined spin className="text-blue-500" />}
                                     {task.status === 'error' && (
                                         <Tooltip title={task.errorMessage}>
                                             <ExclamationCircleOutlined className="text-red-500 cursor-pointer" />
                                         </Tooltip>
                                     )}
                                 </div>
                             </div>
                             {(task.status === 'uploading' || task.status === 'pending' || task.status === 'processing') && (
                                 <Progress percent={Math.floor(task.progress)} size="small" status={task.status === 'processing' ? 'active' : 'normal'} showInfo={false} />
                             )}
                             {task.status === 'error' && (
                                 <Progress percent={Math.floor(task.progress)} size="small" status="exception" showInfo={false} />
                             )}
                         </div>
                     ))}
                     {queue.length === 0 && (
                         <div className="p-4 text-center text-gray-500 text-sm">No uploads in queue</div>
                     )}
                 </div>
             )}
        </div>
    );
};
