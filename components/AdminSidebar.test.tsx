import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AdminSidebar } from './AdminComponents';

describe('AdminSidebar interactions', () => {
  test('invokes onNavigate when a menu item is clicked', async () => {
    const onNavigate = vi.fn();
    const user = userEvent.setup();

    render(<AdminSidebar activePage="dashboard" onNavigate={onNavigate} />);

    const ordersLinks = screen.getAllByText('Orders');
    await user.click(ordersLinks[0]);

    expect(onNavigate).toHaveBeenCalledWith('orders');
  });

  test('catalog accordion toggles visibility of category links', async () => {
    const user = userEvent.setup();

    render(<AdminSidebar />);

    expect(screen.getAllByText('Categories')[0]).toBeInTheDocument();

    await user.click(screen.getAllByText('Catalog')[0]);

    expect(screen.queryByText('Categories')).not.toBeInTheDocument();
  });
});
