import '@testing-library/jest-dom';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, renderHook, waitFor, screen, fireEvent } from '@testing-library/react';
import LoginPage from '../pages/LoginPage';
import { RouterProvider, createMemoryRouter } from 'react-router-dom';
import useLogin from '../hooks/useLogin';
import * as nock from 'nock';

const queryClient = new QueryClient({
  defaultOptions: {},
});

const wrapper = ({ children }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe('로그인 테스트', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });
  afterAll(() => {
    jest.restoreAllMocks();
  });
  test('로그인에 실패하면 에러메세지가 나타난다', async () => {
    // given - 로그인 화면이 그려진다
    const routes = [
      {
        path: '/login',
        element: <LoginPage />,
      },
    ];

    const router = createMemoryRouter(routes, {
      initialEntries: ['/login'],
      initialIndex: 0,
    });

    render(
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={router} />
      </QueryClientProvider>
    );

    // when - 사용자가 로그인에 실패한다
    nock('https://inflearn.byeongjinkang.com')
      .post('/user/login', { username: 'wrong@email.com', password: 'wrongPassword' })
      .reply(400, { msg: 'NO_SUCH_USER' });

    const emailInput = screen.getByLabelText('이메일');
    const passwordInput = screen.getByLabelText('비밀번호');

    fireEvent.change(emailInput, { target: { value: 'wrong@email.com' } });
    fireEvent.change(passwordInput, { target: { value: 'wrongPassword' } });

    const loginButton = screen.getByRole('button', { name: '로그인' });
    fireEvent.click(loginButton);

    const { result } = renderHook(() => useLogin(), { wrapper });

    // then - 에러메세지가 나타난다
    await waitFor(() => result.current.isError);
    const errorMessage = await screen.findByTestId('error-message');
    // console.log(errorMessage);
    expect(errorMessage).toBeInTheDocument();
  });
});
