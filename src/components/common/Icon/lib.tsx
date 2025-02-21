import * as React from 'react'

function getSize(height: number, width: number, ratio: number = 1) {
    return {
        height: height * ratio,
        width: width * ratio,
    }
}

export const defaultProps = {
    fill: 'none',
    xmlns: 'http://www.w3.org/2000/svg',
}

/* eslint-disable */
const library: Record<string, React.ElementType> = {
    arrowDown: ({ ratio, ...props }) => <svg {...defaultProps} {...props} viewBox="0 0 20 20" {...getSize(20, 20, ratio)}><path d="M10 12.5L5 7.5H15L10 12.5Z"/></svg>,
    externalLink: ({ ratio, ...props }) => <svg {...defaultProps} {...props} viewBox="0 0 16 16" {...getSize(16, 16, ratio)}><path fillRule="evenodd" clipRule="evenodd" d="M7.70421 9.70711L13.9971 3.41421V7H15.9971V0H8.9971V2H12.5829L6.28999 8.29289L7.70421 9.70711ZM15 14V10H13V14H2V3H6V1H2C0.89543 1 0 1.89543 0 3V14C0 15.1046 0.89543 16 2 16H13C14.1046 16 15 15.1046 15 14Z" fill="currentColor"/></svg>,
    close: ({ ratio, ...props }) => <svg {...defaultProps} {...props} viewBox="0 0 40 40" {...getSize(40, 40, ratio)}><path d="M14 14L20 20M20 20L14 26M20 20L26 14M20 20L26 26" stroke="currentColor" strokeWidth={2}/></svg>,
    config: ({ ratio, ...props }) => <svg {...defaultProps} {...props} viewBox="0 0 24 24" {...getSize(24, 24, ratio)}><path d="M17.0458 20.2491C17.8104 19.764 18.503 19.1724 19.1031 18.4941L21.2666 19.7627L23.2365 16.298L21.0774 15.0321C21.3519 14.181 21.5134 13.2783 21.5436 12.3426L24 11.9028L23.3156 7.9629L20.8597 8.40269C20.5203 7.54852 20.0649 6.75427 19.5127 6.04049L21.1181 4.09798L18.0999 1.52657L16.4959 3.46742C15.7124 3.04112 14.864 2.72245 13.9698 2.53122V0L10.03 0V2.53122C9.13573 2.72245 8.2873 3.04112 7.50375 3.46742L5.89979 1.52657L2.88162 4.09807L4.48685 6.04058C3.93473 6.75436 3.47938 7.54871 3.13997 8.40279L0.684057 7.96299L0 11.9029L2.45601 12.3427C2.48628 13.2785 2.64785 14.181 2.92238 15.0324L0.763035 16.2982L2.73306 19.7628L4.89665 18.4946C5.49658 19.1725 6.18913 19.7643 6.95388 20.2494L6.09985 22.6317L9.80225 23.9998L10.6551 21.6207C11.0946 21.6839 11.5435 21.7174 11.9999 21.7174C12.4563 21.7174 12.9053 21.684 13.3448 21.6207L14.1976 24L17.8998 22.6315L17.0458 20.2491ZM11.9997 18C8.6861 17.9999 6 15.3136 6 12C6 8.68629 8.68629 6 12 6C15.3137 6 18 8.68629 18 12C18 15.3138 15.3135 18.0002 11.9997 18Z"/></svg>,
    info: ({ ratio, ...props }) => <svg {...defaultProps} {...props} viewBox="0 0 20 20" {...getSize(20, 20, ratio)}><path fillRule="evenodd" clipRule="evenodd" d="M10 18C14.4183 18 18 14.4183 18 10C18 5.58172 14.4183 2 10 2C5.58172 2 2 5.58172 2 10C2 14.4183 5.58172 18 10 18ZM10 17C13.866 17 17 13.866 17 10C17 6.13401 13.866 3 10 3C6.13401 3 3 6.13401 3 10C3 13.866 6.13401 17 10 17ZM10.75 9V14H9.25V9H10.75ZM10.75 7V5.5H9.25V7H10.75Z"/></svg>,
    link: ({ ratio, ...props }) => <svg {...defaultProps} {...props} viewBox="0 0 20 20" {...getSize(20, 20, ratio)}><path fill="none" stroke="currentColor" strokeWidth={1.1} d="M10.625,12.375 L7.525,15.475 C6.825,16.175 5.925,16.175 5.225,15.475 L4.525,14.775 C3.825,14.074 3.825,13.175 4.525,12.475 L7.625,9.375"/><path fill="none" stroke="currentColor" strokeWidth={1.1} d="M9.325,7.375 L12.425,4.275 C13.125,3.575 14.025,3.575 14.724,4.275 L15.425,4.975 C16.125,5.675 16.125,6.575 15.425,7.275 L12.325,10.375"/><path fill="none" stroke="currentColor" strokeWidth={1.1} d="M7.925,11.875 L11.925,7.975"/></svg>,
    loader: ({ ratio, ...props }) => <svg {...defaultProps} {...props} viewBox="0 0 22 22" {...getSize(22, 22, ratio)}><path d="M11 22C17.0959 22 22 17.0959 22 11C22 7.12134 20.0146 3.72514 17 1.76773L16 3.45543C18.4345 5.04268 20 7.78975 20 11C20 16.0799 16.0799 20 11 20C5.92011 20 2 16.0799 2 11C2 5.92011 5.92011 2 11 2V0C4.90413 0 0 4.90413 0 11C0 17.0959 4.90413 22 11 22Z" fill="currentColor"/></svg>,
    logout: ({ ratio, ...props }) => <svg {...defaultProps} {...props} viewBox="0 0 32 32" {...getSize(32, 32, ratio)}><path fillRule="evenodd" clipRule="evenodd" d="M18.4753 18.2903H19.295H20.1146V21.5162V23.9355H15.1966L15.1967 27L13.0492 26.2799L8.11633 24.662C7.4459 24.433 7 24.2782 7 24.2782V7H8.63938C8.66196 7 8.68378 7.00459 8.70558 7.00919C8.72248 7.01275 8.73936 7.0163 8.75659 7.01772C8.76929 7.01605 8.78125 7.01267 8.79315 7.00931C8.80968 7.00464 8.8261 7 8.84424 7H17.6556H20.1146V11.8387H19.295H18.4753L18.4754 8.61267L17.6556 8.61281H13.8376H11.918L15.1966 9.41936V22.3226H18.4753V21.5162V18.2903ZM23.153 11.2686L27 15.0644C27 15.0644 26.7522 15.3194 26.4318 15.6346L23.153 18.8605L21.7541 20.2257L21.7539 15.8709H17.6556V15.0645V14.2581H21.7539L21.7541 9.90301L23.153 11.2686Z"/></svg>,
    plus: ({ ratio, ...props }) => <svg {...defaultProps} {...props} viewBox="0 0 36 36" {...getSize(36, 36, ratio)}><path d="M18 27V9" stroke="currentColor" strokeWidth={2}/><path d="M9 18L27 18" stroke="currentColor" strokeWidth={2}/></svg>,
    pull: ({ ratio, ...props }) => <svg {...defaultProps} {...props} viewBox="0 0 22 21" {...getSize(21, 22, ratio)}><path d="M11 0V13.3333M11 13.3333L16 8.33333M11 13.3333L6 8.33333" stroke="currentColor" strokeWidth={2}/><path d="M1.83334 12.5V19.1667H20.1667V12.5" stroke="currentColor" strokeWidth={2}/></svg>,
    push: ({ ratio, ...props }) => <svg {...defaultProps} {...props} viewBox="0 0 22 21" {...getSize(21, 22, ratio)}><path d="M11 14.334L11 2.00065M11 2.00065L6 7.00065M11 2.00065L16 7.00065" stroke="currentColor" strokeWidth={2}/><path d="M1.83334 12.5V19.1667H20.1667V12.5" stroke="currentColor" strokeWidth={2}/></svg>,
    remove: ({ ratio, ...props }) => <svg {...defaultProps} {...props} viewBox="0 0 14 14" {...getSize(14, 14, ratio)}><path d="M1 1L7 7M7 7L1 13M7 7L13 1M7 7L13 13" stroke="currentColor" strokeWidth={2}/></svg>,
    reverse: ({ ratio, ...props }) => <svg {...defaultProps} {...props} viewBox="0 0 36 36" {...getSize(36, 36, ratio)}><path d="M16 24L12 28M12 28L8 24M12 28C12 28 12 20.6863 12 16C12 13.6667 16 12 16 12" strokeWidth={1.4}/><path d="M20 12L24 8M24 8L28 12M24 8C24 8 24 15.3137 24 20C24 22.3333 20 24 20 24" strokeWidth={1.4}/></svg>,
    reverseHorizontal: ({ ratio, ...props }) => <svg {...defaultProps} {...props} viewBox="0 0 24 24" {...getSize(24, 24, ratio)}><path d="M15.6001 13.2002L18.0001 15.6002M18.0001 15.6002L15.6001 18.0002M18.0001 15.6002C18.0001 15.6002 13.6119 15.6002 10.8001 15.6002C9.40015 15.6002 8.40015 13.2002 8.40015 13.2002" strokeWidth={1.4}/><path d="M8.39985 10.7998L5.99985 8.3998M5.99985 8.3998L8.39985 5.9998M5.99985 8.3998C5.99985 8.3998 10.3881 8.3998 13.1999 8.3998C14.5999 8.3998 15.5999 10.7998 15.5999 10.7998" strokeWidth={1.4}/></svg>,

}


export default library
