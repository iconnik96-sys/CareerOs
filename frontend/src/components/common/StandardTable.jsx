import React from 'react';

/**
 * StandardTable matching Admin Dashboard data table specifications:
 * Header: #0d1424 with uppercase font-size 0.75rem, letter-spacing 0.05em
 * Cells: padding 14px 18px, border-bottom 1px solid var(--border-subtle)
 * Hover row: var(--bg-card-hover)
 */
export const StandardTable = ({
  columns = [],
  data = [],
  keyField = 'id',
  emptyMessage = 'No records found.',
  className = '',
  style = {},
  renderRow,
  ...props
}) => {
  return (
    <div className={`table-wrapper ${className}`} style={style} {...props}>
      <table className="table">
        <thead>
          <tr>
            {columns.map((col, idx) => (
              <th
                key={col.key || idx}
                style={{
                  textAlign: col.align || 'left',
                  width: col.width || 'auto',
                  ...col.headerStyle
                }}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                style={{ textAlign: 'center', padding: '36px 18px', color: 'var(--text-muted)' }}
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((item, rowIdx) => {
              if (renderRow) return renderRow(item, rowIdx);
              const rowKey = item[keyField] || rowIdx;
              return (
                <tr key={rowKey}>
                  {columns.map((col, colIdx) => (
                    <td
                      key={col.key || colIdx}
                      style={{
                        textAlign: col.align || 'left',
                        ...col.cellStyle
                      }}
                    >
                      {col.render ? col.render(item[col.key], item, rowIdx) : item[col.key]}
                    </td>
                  ))}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};

export default StandardTable;

