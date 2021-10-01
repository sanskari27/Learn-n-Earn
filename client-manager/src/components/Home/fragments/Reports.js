import './Reports.css';
import ExportButton from './ExportButton';

const Reports = ({ setLoading }) => {
	const GenerateReport = (e) => {
		setLoading(true);

		setLoading(false);
	};
	return (
		<div className='report'>
			<h4>Report Panel</h4>
			<div className='row justify-content-around'>
				<div className='col-3'>
					<div
						onClick={(e) => {
							window.open('/reports/exam-wise', '_blank');
						}}
					>
						<span style={{ display: 'block' }}>Team Wise</span>
						<span style={{ display: 'block' }}>Examination Report</span>
					</div>
				</div>
				<div className='col-3'>
					<div
						onClick={(e) => {
							window.open('/reports/interview-wise', '_blank');
						}}
					>
						<span style={{ display: 'block' }}>Team Wise</span>
						<span style={{ display: 'block' }}>Interview Report</span>
					</div>
				</div>
				<div className='col-3'>
					<div
						onClick={(e) => {
							window.open('/reports/admission-wise', '_blank');
						}}
					>
						<span style={{ display: 'block' }}>Team Wise</span>
						<span style={{ display: 'block' }}>Admission Report</span>
					</div>
				</div>
				<div className='col-3' onClick={GenerateReport}>
					{/* <ExportButton margin='0 auto' /> */}
				</div>
			</div>
			<div className='row justify-content-around'>
				<div className='col-3'>
					<div
						onClick={(e) => {
							window.open('/reports/state-wise', '_blank');
						}}
					>
						<span style={{ display: 'block' }}>State Wise</span>
						<span style={{ display: 'block' }}>Admission Report</span>
					</div>
				</div>
				<div className='col-3'>
					<div
						onClick={(e) => {
							window.open('/reports/company-wise', '_blank');
						}}
					>
						<span style={{ display: 'block' }}>Company Wise</span>
						<span style={{ display: 'block' }}>Admission Report</span>
					</div>
				</div>
				<div className='col-3'>
					<div
						onClick={(e) => {
							window.open('/reports/source-wise', '_blank');
						}}
					>
						<span style={{ display: 'block' }}>Source Wise</span>
						<span style={{ display: 'block' }}>&nbsp;</span>
					</div>
				</div>
				<div className='col-3'>
					<div
						onClick={(e) => {
							window.open('/reports/call-wise', '_blank');
						}}
					>
						<span style={{ display: 'block' }}>Call Wise</span>
						<span style={{ display: 'block' }}>&nbsp;</span>
					</div>
				</div>
			</div>
		</div>
	);
};

export default Reports;
