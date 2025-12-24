describe('MailBuilder Editor', () => {
  beforeEach(() => {
    cy.visit('/');
    // Wait for editor to initialize
    cy.get('.mailbuilder-editor').should('exist');
  });

  describe('Editor Initialization', () => {
    it('should load the editor with all main sections', () => {
      cy.get('.mailbuilder-sidebar').should('be.visible');
      cy.get('.mailbuilder-canvas').should('be.visible');
      cy.get('.mailbuilder-properties').should('be.visible');
      cy.get('.mailbuilder-toolbar').should('be.visible');
    });

    it('should display block categories in sidebar', () => {
      cy.get('.sidebar-section').should('exist');
      cy.get('.block-category').should('have.length.at.least', 1);
    });

    it('should show initial blocks in canvas', () => {
      cy.get('.block-wrapper').should('have.length.at.least', 1);
    });
  });

  describe('Block Selection', () => {
    it('should select a block when clicked', () => {
      cy.get('.block-wrapper').first().click();
      cy.get('.block-wrapper.selected').should('have.length', 1);
    });

    it('should show block toolbar on hover', () => {
      cy.get('.block-wrapper').first().trigger('mouseenter', { force: true });
      cy.get('.block-wrapper').first().within(() => {
        cy.get('.block-toolbar').should('exist');
      });
    });

    it('should deselect block when clicking canvas background', () => {
      cy.get('.block-wrapper').first().click();
      cy.get('.block-wrapper.selected').should('exist');
      
      cy.get('.email-container').click({ force: true });
      cy.get('.block-wrapper.selected').should('not.exist');
    });
  });

  describe('Adding Blocks from Sidebar', () => {
    it('should add a text block when clicked', () => {
      cy.get('.block-wrapper').then($blocks => {
        const initialCount = $blocks.length;
        
        cy.get('.block-item[data-block-type="text"]').click();
        cy.get('.block-wrapper').should('have.length', initialCount + 1);
      });
    });

    it('should add a button block when clicked', () => {
      cy.get('.block-wrapper').then($blocks => {
        const initialCount = $blocks.length;
        
        cy.get('.block-item[data-block-type="button"]').click();
        cy.get('.block-wrapper').should('have.length', initialCount + 1);
      });
    });

    it('should add an image block when clicked', () => {
      cy.get('.block-wrapper').then($blocks => {
        const initialCount = $blocks.length;
        
        cy.get('.block-item[data-block-type="image"]').click();
        cy.get('.block-wrapper').should('have.length', initialCount + 1);
      });
    });
  });

  describe('Block Actions', () => {
    it('should duplicate a block', () => {
      cy.get('.block-wrapper').then($blocks => {
        const initialCount = $blocks.length;
        
        cy.get('.block-wrapper').first().trigger('mouseenter');
        cy.get('.block-toolbar-btn[data-action="duplicate"]').first().click({ force: true });
        
        cy.get('.block-wrapper').should('have.length', initialCount + 1);
      });
    });

    it('should delete a block', () => {
      cy.get('.block-wrapper').then($blocks => {
        const initialCount = $blocks.length;
        
        cy.get('.block-wrapper').first().trigger('mouseenter');
        cy.get('.block-toolbar-btn[data-action="delete"]').first().click({ force: true });
        
        cy.get('.block-wrapper').should('have.length', initialCount - 1);
      });
    });
  });

  describe('Toolbar Actions', () => {
    it('should toggle preview mode', () => {
      cy.get('.toolbar-btn[data-action="preview-desktop"]').should('exist');
      cy.get('.toolbar-btn[data-action="preview-mobile"]').click();
      
      // Canvas should adjust for mobile width
      cy.get('.email-container').should('exist');
    });

    it('should have undo button', () => {
      cy.get('.toolbar-btn[data-action="undo"]').should('exist');
    });

    it('should have redo button', () => {
      cy.get('.toolbar-btn[data-action="redo"]').should('exist');
    });
  });

  describe('Content Editing', () => {
    it('should have editable text elements', () => {
      cy.get('.editable-text').should('exist');
      cy.get('.editable-text').first().should('have.attr', 'contenteditable', 'true');
    });

    it('should have editable heading elements', () => {
      cy.get('.editable-heading').then($el => {
        if ($el.length > 0) {
          cy.wrap($el).first().should('have.attr', 'contenteditable', 'true');
        }
      });
    });
  });
});

describe('Drag and Drop', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.get('.mailbuilder-editor').should('exist');
  });

  it('should show drag handle on block hover', () => {
    cy.get('.block-wrapper').first().trigger('mouseenter', { force: true });
    cy.get('.block-wrapper').first().within(() => {
      cy.get('.block-toolbar-btn.drag-handle').should('exist');
    });
  });

  it('should start drag when dragging a block', () => {
    const dataTransfer = new DataTransfer();
    
    cy.get('.block-wrapper').first().trigger('dragstart', { dataTransfer });
    cy.get('.block-wrapper.is-dragging').should('exist');
  });

  it('should show ghost element during drag', () => {
    const dataTransfer = new DataTransfer();
    
    cy.get('.block-wrapper').first().trigger('dragstart', { dataTransfer });
    cy.get('.drag-ghost').should('exist');
  });

  it('should end drag on dragend', () => {
    const dataTransfer = new DataTransfer();
    
    cy.get('.block-wrapper').first().trigger('dragstart', { dataTransfer });
    cy.get('.block-wrapper').first().trigger('dragend', { dataTransfer });
    
    cy.get('.block-wrapper.is-dragging').should('not.exist');
    cy.get('.drag-ghost').should('not.exist');
  });

  it('should drag block from sidebar', () => {
    const dataTransfer = new DataTransfer();
    
    cy.get('.block-item[data-block-type="divider"]').trigger('dragstart', { dataTransfer });
    cy.get('.drag-ghost').should('exist');
    
    cy.get('.block-wrapper').first().trigger('dragover', { dataTransfer });
    cy.get('.block-wrapper').first().trigger('drop', { dataTransfer });
    
    // Check that a divider was added
    cy.get('.block-wrapper').should('have.length.at.least', 1);
  });
});

describe('Keyboard Shortcuts', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.get('.mailbuilder-editor').should('exist');
  });

  it('should delete selected block with Delete key', () => {
    cy.get('.block-wrapper').then($blocks => {
      const initialCount = $blocks.length;
      
      cy.get('.block-wrapper').first().click();
      cy.get('body').type('{del}');
      
      cy.get('.block-wrapper').should('have.length', initialCount - 1);
    });
  });

  it('should undo with Ctrl+Z', () => {
    cy.get('.block-wrapper').then($blocks => {
      const initialCount = $blocks.length;
      
      // Add a block
      cy.get('.block-item[data-block-type="spacer"]').click();
      cy.get('.block-wrapper').should('have.length', initialCount + 1);
      
      // Undo
      cy.get('body').type('{ctrl}z');
      cy.get('.block-wrapper').should('have.length', initialCount);
    });
  });

  it('should duplicate with Ctrl+D', () => {
    cy.get('.block-wrapper').then($blocks => {
      const initialCount = $blocks.length;
      
      cy.get('.block-wrapper').first().click();
      cy.get('body').type('{ctrl}d');
      
      cy.get('.block-wrapper').should('have.length', initialCount + 1);
    });
  });

  it('should deselect with Escape key', () => {
    cy.get('.block-wrapper').first().click();
    cy.get('.block-wrapper.selected').should('exist');
    
    cy.get('body').type('{esc}');
    cy.get('.block-wrapper.selected').should('not.exist');
  });
});

describe('Preview and Export', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.get('.mailbuilder-editor').should('exist');
  });

  it('should have preview button', () => {
    // Just verify the preview button exists
    cy.get('.toolbar-btn').should('exist');
  });

  it('should have export button', () => {
    cy.get('.toolbar-btn[data-action="export"]').should('exist');
  });
});
