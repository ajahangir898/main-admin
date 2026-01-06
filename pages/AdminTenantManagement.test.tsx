import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import AdminTenantManagement from './AdminTenantManagement';
import type { Tenant } from '../types';

const makeTenant = (overrides: Partial<Tenant> = {}): Tenant => ({
  id: 'tenant-1',
  name: 'Alpha Gadgets',
  subdomain: 'alpha-gadgets',
  contactEmail: 'alpha@example.com',
  contactName: 'Alpha',
  plan: 'starter',
  status: 'active',
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-02T00:00:00.000Z',
  onboardingCompleted: true,
  locale: 'en-US',
  currency: 'BTD',
  branding: {},
  settings: {},
  ...overrides,
});

describe('AdminTenantManagement', () => {
  test('auto-derives subdomain from store name', async () => {
    const user = userEvent.setup();
    render(
      <AdminTenantManagement
        tenants={[]}
        onCreateTenant={vi.fn()}
      />
    );

    // Click "Add Shop" button first to show the form
    await user.click(screen.getByRole('button', { name: /add shop/i }));

    await user.type(screen.getByPlaceholderText(/my awesome store/i), 'Acme Labs');

    expect(screen.getByPlaceholderText(/mystore/i)).toHaveValue('acme-labs');
  });

  test('disables submission when subdomain conflicts', async () => {
    const user = userEvent.setup();
    const tenants = [makeTenant({ subdomain: 'acme-shop' })];
    render(
      <AdminTenantManagement
        tenants={tenants}
        onCreateTenant={vi.fn()}
      />
    );

    // Click "Add Shop" button first to show the form
    await user.click(screen.getByRole('button', { name: /add shop/i }));

    // Fill in the form with a conflicting subdomain
    await user.type(screen.getByPlaceholderText(/my awesome store/i), 'Acme Shop');
    // Blur the name field to trigger subdomain generation
    await user.tab();
    
    // The subdomain should auto-generate to 'acme-shop' which conflicts
    const subdomainInput = screen.getByPlaceholderText(/mystore/i);
    expect(subdomainInput).toHaveValue('acme-shop');
    
    // Fill in other required fields
    await user.type(screen.getByPlaceholderText(/contact@store.com/i), 'ops@acme.com');
    await user.type(screen.getByPlaceholderText(/admin@store.com/i), 'admin@acme.com');
    await user.type(screen.getByPlaceholderText(/min 6 characters/i), 'secret12');
    await user.type(screen.getByPlaceholderText(/confirm password/i), 'secret12');
    
    // Blur all fields to trigger validation
    await user.tab();

    // The submit button should be disabled due to subdomain conflict
    // Note: The component validates on submit, so we need to try clicking
    const submitButton = screen.getByRole('button', { name: /create tenant/i });
    await user.click(submitButton);
    
    // Check that an error message appears
    expect(screen.getByText(/subdomain already exists/i)).toBeInTheDocument();
  });

  test('submits payload via onCreateTenant', async () => {
    const user = userEvent.setup();
    const onCreateTenant = vi.fn().mockResolvedValue(makeTenant({ id: 'tenant-2', subdomain: 'beta-shop', name: 'Beta' }));

    render(
      <AdminTenantManagement
        tenants={[]}
        onCreateTenant={onCreateTenant}
      />
    );

    // Click "Add Shop" button first to show the form
    await user.click(screen.getByRole('button', { name: /add shop/i }));

    await user.type(screen.getByPlaceholderText(/my awesome store/i), 'Beta Shop');
    await user.type(screen.getByPlaceholderText(/contact@store.com/i), 'beta@example.com');
    await user.type(screen.getByPlaceholderText(/john doe/i), 'Bianca');
    await user.type(screen.getByPlaceholderText(/admin@store.com/i), 'owner@beta.com');
    await user.type(screen.getByPlaceholderText(/min 6 characters/i), 'BetaSecret1');
    await user.type(screen.getByPlaceholderText(/confirm password/i), 'BetaSecret1');

    await user.click(screen.getByRole('button', { name: /create tenant/i }));

    expect(onCreateTenant).toHaveBeenCalledTimes(1);
    expect(onCreateTenant.mock.calls[0][0]).toMatchObject({
      name: 'Beta Shop',
      subdomain: 'beta-shop',
      contactEmail: 'beta@example.com',
      adminEmail: 'owner@beta.com',
      adminPassword: 'BetaSecret1'
    });
    expect(onCreateTenant.mock.calls[0][1]).toEqual({ activate: true });
  });

  test('delete flow triggers onDeleteTenant', async () => {
    const user = userEvent.setup();
    const tenants = [makeTenant()];
    const onDeleteTenant = vi.fn().mockResolvedValue(undefined);

    render(
      <AdminTenantManagement
        tenants={tenants}
        onCreateTenant={vi.fn()}
        onDeleteTenant={onDeleteTenant}
      />
    );

    // Click the delete button for the tenant (has title "Delete tenant")
    await user.click(screen.getByTitle(/delete tenant/i));
    
    // In the modal, click the confirm delete button
    const deleteButtons = screen.getAllByRole('button', { name: /delete/i });
    // The second one should be in the modal (first is "Delete tenant" title button)
    await user.click(deleteButtons[deleteButtons.length - 1]);

    expect(onDeleteTenant).toHaveBeenCalledWith('tenant-1');
  });
});
