import { ApiError } from '@repo/api-errors';

export function App() {
  const error = new ApiError({
    message: 'test',
    cause: new Error('test'),
  });

  console.log(error);

  return (
    <div>
      <h1>Hello Worlds</h1>
    </div>
  );
}
