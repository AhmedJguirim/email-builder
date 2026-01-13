describe('Block Properties Panel', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.get('.mailbuilder-editor').should('exist');
  });

  describe('List Block Properties', () => {
    beforeEach(() => {
      cy.get('.block-item[data-block-type="list"]').click();
      cy.get('.block-wrapper').last().click();
    });

    it('should display list type selector', () => {
      cy.get('#list-type').should('exist');
    });

    it('should allow changing list type', () => {
      cy.get('#list-type').select('ordered');
      cy.get('.block-wrapper').last().find('ol').should('exist');
    });

    it('should display list items editor', () => {
      cy.get('.list-items-editor').should('exist');
      cy.get('.list-item-input').should('have.length.at.least', 1);
    });

    it('should allow editing list items', () => {
      cy.get('.list-item-input').first().clear().type('Updated item').blur();
      cy.get('.block-wrapper').last().should('contain', 'Updated item');
    });

    it('should allow adding new list items', () => {
      cy.get('.list-item-input').then($items => {
        const initialCount = $items.length;
        cy.get('#add-list-item').click();
        cy.get('.list-item-input').should('have.length', initialCount + 1);
      });
    });

    it('should allow removing list items', () => {
      cy.get('.list-item-input').then($items => {
        if ($items.length > 1) {
          const initialCount = $items.length;
          cy.get('.remove-list-item').first().click();
          cy.get('.list-item-input').should('have.length', initialCount - 1);
        }
      });
    });
  });

  describe('Video Block Properties', () => {
    beforeEach(() => {
      cy.get('.block-item[data-block-type="video"]').click();
      cy.get('.block-wrapper').last().click();
    });

    it('should display video URL input', () => {
      cy.get('#video-url').should('exist');
    });

    it('should display thumbnail URL input', () => {
      cy.get('#video-thumbnail').should('exist');
    });

    it('should display play button color picker', () => {
      cy.get('#video-play-color').should('exist');
    });

    it('should show YouTube thumbnail when URL is entered', () => {
      cy.get('#video-url').type('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
      cy.get('#video-url').blur();
      cy.get('.block-wrapper').last().find('.video-preview img').should('exist');
    });
  });

  describe('Social Block Properties', () => {
    beforeEach(() => {
      cy.get('.block-item[data-block-type="social"]').click();
      cy.get('.block-wrapper').last().click();
    });

    it('should display alignment selector', () => {
      cy.get('#social-alignment').should('exist');
    });

    it('should display icon size input', () => {
      cy.get('#social-icon-size').should('exist');
    });

    it('should display social links editor', () => {
      cy.get('.social-links-editor').should('exist');
      cy.get('.social-link-row').should('have.length.at.least', 1);
    });

    it('should allow changing platform', () => {
      cy.get('.social-platform-select').first().select('instagram');
      cy.get('.social-platform-select').first().should('have.value', 'instagram');
    });

    it('should allow editing social link URL', () => {
      cy.get('.social-url-input').first().clear().type('https://instagram.com/test');
      cy.get('.social-url-input').first().should('have.value', 'https://instagram.com/test');
    });

    it('should allow adding new social links', () => {
      cy.get('.social-link-row').then($rows => {
        const initialCount = $rows.length;
        cy.get('#add-social-link').click();
        cy.get('.social-link-row').should('have.length', initialCount + 1);
      });
    });

    it('should allow removing social links', () => {
      cy.get('.social-link-row').then($rows => {
        if ($rows.length > 1) {
          const initialCount = $rows.length;
          cy.get('.remove-social-link').first().click();
          cy.get('.social-link-row').should('have.length', initialCount - 1);
        }
      });
    });
  });

  describe('Menu Block Properties', () => {
    beforeEach(() => {
      cy.get('.block-item[data-block-type="menu"]').click();
      cy.get('.block-wrapper').last().click();
    });

    it('should display layout selector', () => {
      cy.get('#menu-layout').should('exist');
    });

    it('should display separator input', () => {
      cy.get('#menu-separator').should('exist');
    });

    it('should display menu items editor', () => {
      cy.get('.menu-items-editor').should('exist');
      cy.get('.menu-item-row').should('have.length.at.least', 1);
    });

    it('should allow editing menu item text', () => {
      cy.get('.menu-item-text').first().clear().type('New Menu Text').blur();
      cy.get('.block-wrapper').last().should('contain', 'New Menu Text');
    });

    it('should allow editing menu item link', () => {
      cy.get('.menu-item-link').first().clear().type('https://example.com');
      cy.get('.menu-item-link').first().should('have.value', 'https://example.com');
    });

    it('should allow adding new menu items', () => {
      cy.get('.menu-item-row').then($rows => {
        const initialCount = $rows.length;
        cy.get('#add-menu-item').click();
        cy.get('.menu-item-row').should('have.length', initialCount + 1);
      });
    });
  });

  describe('Logo Block Properties', () => {
    beforeEach(() => {
      cy.get('.block-item[data-block-type="logo"]').click();
      cy.get('.block-wrapper').last().click();
    });

    it('should display logo URL input', () => {
      cy.get('#logo-src').should('exist');
    });

    it('should display upload button', () => {
      cy.get('#btn-upload-logo').should('exist');
    });

    it('should display alt text input', () => {
      cy.get('#logo-alt').should('exist');
    });

    it('should display width input', () => {
      cy.get('#logo-width').should('exist');
    });

    it('should display alignment selector', () => {
      cy.get('#logo-alignment').should('exist');
    });

    it('should allow changing alignment', () => {
      cy.get('#logo-alignment').select('left');
      cy.get('#logo-alignment').should('have.value', 'left');
    });
  });

  describe('Header Block Properties', () => {
    beforeEach(() => {
      cy.get('.block-item[data-block-type="header"]').click();
      cy.get('.block-wrapper').last().click();
    });

    it('should display preheader text input', () => {
      cy.get('#header-preheader').should('exist');
    });

    it('should display show web version checkbox', () => {
      cy.get('#header-show-web').should('exist');
    });

    it('should display web version text input', () => {
      cy.get('#header-web-text').should('exist');
    });

    it('should allow toggling web version display', () => {
      cy.get('#header-show-web').click();
      cy.get('#header-show-web').should('not.be.checked');
    });
  });

  describe('Footer Block Properties', () => {
    beforeEach(() => {
      cy.get('.block-item[data-block-type="footer"]').click();
      cy.get('.block-wrapper').last().click();
    });

    it('should display footer content textarea', () => {
      cy.get('#footer-content').should('exist');
    });

    it('should display unsubscribe checkbox', () => {
      cy.get('#footer-show-unsubscribe').should('exist');
    });

    it('should display show address checkbox', () => {
      cy.get('#footer-show-address').should('exist');
    });

    it('should display address input', () => {
      cy.get('#footer-address').should('exist');
    });

    it('should allow editing footer content', () => {
      cy.get('#footer-content').clear().type('Custom footer text');
      cy.get('#footer-content').blur();
      cy.get('.block-wrapper').last().should('contain', 'Custom footer text');
    });
  });

  describe('Image Block Properties', () => {
    beforeEach(() => {
      cy.get('.block-item[data-block-type="image"]').click();
      cy.get('.block-wrapper').last().click();
    });

    it('should display image URL input', () => {
      cy.get('#img-src').should('exist');
    });

    it('should display upload button', () => {
      cy.get('#btn-upload-image').should('exist');
    });

    it('should display width slider', () => {
      cy.get('#img-width-slider').should('exist');
    });

    it('should display width text input', () => {
      cy.get('#img-width').should('exist');
    });

    it('should allow adjusting width with slider', () => {
      cy.get('#img-width-slider').invoke('val', 50).trigger('input');
      cy.get('#img-width').should('have.value', '50%');
    });
  });
});
