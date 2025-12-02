import React from 'react';

interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {}

interface TableHeaderProps
  extends React.TableHTMLAttributes<HTMLTableSectionElement> {}

interface TableBodyProps
  extends React.TableHTMLAttributes<HTMLTableSectionElement> {}

interface TableRowProps extends React.TableHTMLAttributes<HTMLTableRowElement> {}

interface TableCellProps extends React.TableHTMLAttributes<HTMLTableCellElement> {
  isHeader?: boolean;
}

const Table = React.forwardRef<HTMLTableElement, TableProps>(
  ({ className = '', ...props }, ref) => (
    <div className="overflow-x-auto">
      <table
        ref={ref}
        className={`w-full text-sm border-collapse ${className}`}
        {...props}
      />
    </div>
  )
);
Table.displayName = 'Table';

const TableHeader = React.forwardRef<HTMLTableSectionElement, TableHeaderProps>(
  ({ className = '', ...props }, ref) => (
    <thead ref={ref} className={`border-b border-gray-800/20 ${className}`} {...props} />
  )
);
TableHeader.displayName = 'TableHeader';

const TableBody = React.forwardRef<HTMLTableSectionElement, TableBodyProps>(
  ({ className = '', ...props }, ref) => (
    <tbody ref={ref} className={className} {...props} />
  )
);
TableBody.displayName = 'TableBody';

const TableRow = React.forwardRef<HTMLTableRowElement, TableRowProps>(
  ({ className = '', ...props }, ref) => (
    <tr
      ref={ref}
      className={`border-b border-gray-800/20 hover:bg-dark-surface-light/20 transition-colors ${className}`}
      {...props}
    />
  )
);
TableRow.displayName = 'TableRow';

const TableCell = React.forwardRef<HTMLTableCellElement, TableCellProps>(
  ({ isHeader, className = '', ...props }, ref) => {
    const Component = isHeader ? 'th' : 'td';
    const baseStyles = isHeader
      ? 'text-left py-3.5 px-4 font-semibold text-gray-200 bg-dark-surface-light/60 backdrop-blur-sm'
      : 'py-3.5 px-4 text-gray-300';

    return React.createElement(Component, {
      ref,
      className: `${baseStyles} ${className}`,
      ...props,
    });
  }
);
TableCell.displayName = 'TableCell';

export { Table, TableHeader, TableBody, TableRow, TableCell };
