import {io, Socket } from 'socket.io-client';


let notificationSocket: Socket | null = null;

export function connectNotificationSocket(
    accessToken: string,
) {
    if (notificationSocket?.connected) {
        return notificationSocket;
    }

    notificationSocket = io(
        process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') ||
        'http://localhost:3001',
        {
            auth: {
                token: accessToken,
            },
            transports: ['websocket'],
        },
    );

    notificationSocket.on('connect', () => {
        console.log('Notification socket connected: ', notificationSocket?.id);
    });

    notificationSocket.on('connect_error',(error) =>{
        console.error('Notification socket error: ', error.message);
    });

    notificationSocket.on('notification:new',(notification) =>{
        console.log('New real-time notification:', notification);
    })

    return notificationSocket;
}

export function disconnectNotificationSocket(){
    notificationSocket?.disconnect();
    notificationSocket = null;
}
