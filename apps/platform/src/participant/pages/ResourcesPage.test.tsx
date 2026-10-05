import { fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { ResourcesPage } from './ResourcesPage';
import { communityResources } from '../../public/communityCenterResources';

const renderPage = () => render(<MemoryRouter><ResourcesPage /></MemoryRouter>);
describe('VRCC resource directory', () => {
  it('renders every shared resource with its connected destination', () => {
    renderPage();
    expect(screen.getByRole('status')).toHaveTextContent(`${communityResources.length} resources found`);
    for (const resource of communityResources) {
      expect(screen.getByRole('heading', { name: resource.name })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: `${resource.action} →` })).toHaveAttribute('href', resource.href);
    }
    expect(screen.queryByText('Resource navigation is on its way')).not.toBeInTheDocument();
  });
  it('combines search and category filters and explains an empty result', () => {
    renderPage();
    fireEvent.change(screen.getByLabelText('Search resources'), { target: { value: 'legal' } });
    expect(screen.getByRole('status')).toHaveTextContent('1 resource found');
    expect(screen.getByRole('heading', { name: 'Iowa Legal Aid' })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Resource category'), { target: { value: 'Healthcare' } });
    expect(screen.getByRole('status')).toHaveTextContent('0 resources found');
    expect(screen.getByText(/No matching resource yet/)).toBeInTheDocument();
  });
});
